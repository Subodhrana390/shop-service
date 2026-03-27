import { Request, Response } from "express";
import { config } from "../config/index.js";
import { EVENT_TYPES, KafkaManager } from "../infra/kafka/index.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import MedicalShop from "../models/Shop.js";
import inventoryService from "../services/inventory.service.js";
import payoutService from "../services/payout.service.js";
import { ShopSearchService } from "../services/shop-search.service.js";
import userService from "../services/user.service.js";

class ShopController {
  private static instance: ShopController;

  private constructor() { }

  public static getInstance(): ShopController {
    if (!ShopController.instance) {
      ShopController.instance = new ShopController();
    }
    return ShopController.instance;
  }

  public getShops = asyncHandler(async (req: Request, res: Response) => {
    const {
      query,
      city,
      services,
      latitude,
      longitude,
      radius = "10",
      limit = "20",
      cursor,
      sortBy = "distance",
      sortOrder = "asc",
    } = req.query as any;

    let filter: any = { status: "active", verificationStatus: "verified" };
    if (query) filter.$text = { $search: query };
    if (city) filter["address.city"] = new RegExp(city, "i");
    if (services) {
      const servicesArray = Array.isArray(services) ? services : [services];
      filter.services = { $in: servicesArray };
    }

    if (cursor) {
      filter._id = { $lt: cursor };
    }

    const pageSize = parseInt(limit);
    let shops: any[];

    if (latitude && longitude) {
      const coordinates = [parseFloat(longitude), parseFloat(latitude)];
      shops = await MedicalShop.find({
        ...filter,
        "address.coordinates": {
          $near: {
            $geometry: { type: "Point", coordinates },
            $maxDistance: parseFloat(radius) * 1000,
          },
        },
      })
        .limit(pageSize + 1)
        .sort({
          [sortBy === "distance" ? "_id" : sortBy]:
            sortOrder === "desc" ? -1 : 1,
        });
    } else {
      shops = await MedicalShop.find(filter)
        .limit(pageSize + 1)
        .sort({ _id: -1 });
    }

    const hasNextPage = shops.length > pageSize;
    if (hasNextPage) shops.pop();

    const nextCursor = hasNextPage
      ? shops[shops.length - 1]._id.toString()
      : null;

    const ownerIds = shops.map((shop) => shop.ownerId.toString());
    let ownerMap: Record<string, any> = {};

    try {
      const owners = await userService.getUsersByIds(ownerIds);
      owners.forEach((owner: any) => (ownerMap[owner.userId] = owner));
    } catch (err: any) {
      console.error("UserService failed to fetch owners:", err.message);
    }

    shops = shops.map((shop) => {
      const shopObj = shop.toObject();
      shopObj.owner = ownerMap[shop.ownerId.toString()] || null;

      if (
        latitude &&
        longitude &&
        shop.address &&
        shop.address.location &&
        shop.address.location.coordinates
      ) {
        shopObj.distance = shop.calculateDistance
          ? shop.calculateDistance(parseFloat(latitude), parseFloat(longitude))
          : undefined;
      }

      return shopObj;
    });

    if (latitude && longitude && sortBy === "distance") {
      shops.sort((a, b) =>
        sortOrder === "desc"
          ? (b.distance || 0) - (a.distance || 0)
          : (a.distance || 0) - (b.distance || 0),
      );
    }

    res.json({
      success: true,
      data: shops,
      pagination: {
        nextCursor,
        limit: pageSize,
        hasNextPage,
      },
    });
  });

  public getMyMedicalShop = asyncHandler(
    async (req: Request, res: Response) => {
      const shop = await MedicalShop.findOne({ id: req.shop?.id });
      res.status(200).json({
        success: true,
        data: shop,
      });
    },
  );

  public getShopById = asyncHandler(async (req: Request, res: Response) => {
    const shop = await MedicalShop.findOne({
      id: req.params.shopId || req.shop?.id,
    });

    if (!shop) {
      const error: any = new Error("Shop not found");
      error.statusCode = 404;
      throw error;
    }

    if (shop.status !== "active" || shop.verificationStatus !== "verified") {
      const error: any = new Error("Shop is not available");
      error.statusCode = 404;
      throw error;
    }

    let owner = null;
    try {
      owner = await userService.getUserById(shop.ownerId.toString());
    } catch (err: any) {
      console.error("Failed to fetch owner from UserService:", err.message);
    }

    const shopObj = shop.toObject() as any;
    shopObj.owner = owner ? { name: owner.name, email: owner.email } : null;

    res.json({
      success: true,
      data: shopObj,
    });
  });

  public updateShop = asyncHandler(async (req: Request, res: Response) => {
    const shopId = req.shop?.id;
    const updates = req.body;

    const updatedShop = await MedicalShop.findOneAndUpdate(
      { id: shopId },
      { $set: updates },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedShop) {
      const error: any = new Error("Shop not found");
      error.statusCode = 404;
      throw error;
    }

    await KafkaManager.publish({
      topic: config.kafka.topics.shopEvents,
      eventType: EVENT_TYPES.SHOP_UPDATED,
      payload: {
        shopId: updatedShop.id,
        ownerId: updatedShop.ownerId,
        changes: Object.keys(updates),
      },
      metadata: {
        userId: req.user?.id,
      },
    });

    await ShopSearchService.indexShop(updatedShop).catch(() => { });

    res.json({
      success: true,
      message: "Shop updated successfully",
      data: updatedShop,
    });
  });

  public updateShopStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { status, reason } = req.body;
      const shop = await MedicalShop.findOne({ id: req.shop?.id });

      if (!shop) {
        const error: any = new Error("Shop not found");
        error.statusCode = 404;
        throw error;
      }

      const allowedStatuses = ["pending", "active", "inactive", "suspended"];
      if (!allowedStatuses.includes(status)) {
        const error: any = new Error(
          `Invalid status. Allowed: ${allowedStatuses.join(", ")}`,
        );
        error.statusCode = 400;
        throw error;
      }

      if (req.user?.role === "shop-owner" && status === "suspended") {
        const error: any = new Error(
          "Shop owners cannot suspend their own shop",
        );
        error.statusCode = 403;
        throw error;
      }

      if (shop.status === status) {
        res.status(400).json({ message: `Shop is already ${status}` });
        return;
      }

      const oldStatus = shop.status;
      shop.status = status;
      await shop.save();

      await KafkaManager.publish({
        topic: config.kafka.topics.shopEvents,
        eventType: EVENT_TYPES.SHOP_STATUS_CHANGED,
        payload: {
          shopId: shop.id,
          ownerId: shop.ownerId,
          oldStatus,
          newStatus: status,
          reason: reason || "",
        },
        metadata: { userId: req.user?.id },
      });

      await ShopSearchService.indexShop(shop).catch(() => { });

      res.json({
        success: true,
        message: `Shop status updated to ${status}`,
        data: shop,
      });
    },
  );

  public verifyShop = asyncHandler(async (req: Request, res: Response) => {
    const { shopId } = req.params;
    const { status, note } = req.body;

    const shop = await MedicalShop.findOne({ id: shopId });

    if (!shop) {
      const error: any = new Error("Shop not found");
      error.statusCode = 404;
      throw error;
    }

    const oldStatus = shop.verificationStatus;
    shop.verificationStatus = status;
    if (note) shop.verificationNote = note;

    if (status === "verified") {
      shop.status = "active";
    } else if (status === "rejected") {
      shop.status = "suspended";
    }

    await shop.save();

    await ShopSearchService.indexShop(shop).catch(() => { });

    await KafkaManager.publish({
      topic: config.kafka.topics.shopEvents,
      eventType: EVENT_TYPES.SHOP_STATUS_CHANGED,
      payload: {
        shopId: shop.id,
        ownerId: shop.ownerId,
        oldStatus,
        newStatus: status,
        reason: note || "Admin verification updated",
      },
      metadata: { userId: req.user?.id },
    });

    res.json({
      success: true,
      message: `Shop verification status updated to ${status}`,
      data: shop,
    });
  });

  public uploadShopImagesById = asyncHandler(
    async (req: Request, res: Response) => {
      const reqFiles = req.files as any[];
      if (!reqFiles || reqFiles.length === 0) {
        res.status(400).json({
          success: false,
          message: "No images uploaded",
        });
        return;
      }

      const imageUrls = reqFiles.map((file, index) => ({
        url: `/uploads/shops/${file.filename}`,
        alt: req.body?.alt?.[index] || "",
        isPrimary: req.body?.isPrimary?.[index] === "true",
      }));

      await MedicalShop.findOneAndUpdate(
        { id: req.shop?.id },
        { $push: { images: { $each: imageUrls } } },
        { new: true },
      );

      res.status(201).json({
        success: true,
        message: "Shop images uploaded successfully",
        data: imageUrls,
      });
    },
  );

  public getShopDashboard = asyncHandler(
    async (req: Request, res: Response) => {
      const shop = await MedicalShop.findOne({ id: req.shop?.id });
      if (!shop) {
        const error: any = new Error("Shop not found");
        error.statusCode = 404;
        throw error;
      }

      let financialStats = {
        totalOrders: 0,
        totalAmount: 0,
        netPayable: 0,
        paidAmount: 0,
        availableAmount: 0,
        pendingAmount: 0,
      };

      try {
        financialStats = await payoutService.getShopPayoutStats(shop.id);
      } catch (err: any) {
        console.error(
          "Failed to fetch financial stats from PayoutService:",
          err.message,
        );
      }

      let inventorySummary = {
        totalItems: 0,
        totalValue: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        expiringItems: 0,
      };

      try {
        inventorySummary = await inventoryService.getInventoryStats(
          shop.id.toString(),
        );
      } catch (err: any) {
        console.error(
          "Failed to fetch inventory stats from InventoryService:",
          err.message,
        );
      }

      res.json({
        success: true,
        data: {
          shop: {
            id: shop.id,
            name: shop.name,
            status: shop.status,
            verificationStatus: shop.verificationStatus,
            isOpen:
              typeof shop.isOpenNow === "function" ? shop.isOpenNow() : false,
          },
          inventory: inventorySummary,
          finance: financialStats,
          alerts: {
            lowStockAlerts: inventorySummary.lowStockItems,
            expiryAlerts: inventorySummary.expiringItems,
          },
        },
      });
    },
  );

  public releaseEscrow = asyncHandler(async (req: Request, res: Response) => {
    const { payoutId } = req.params;

    if (!payoutId) {
      const error: any = new Error("Payout ID is required");
      error.statusCode = 400;
      throw error;
    }

    const releasedPayout = await payoutService.releasePayout(
      payoutId as string,
    );

    res.json({
      success: true,
      message: "Escrow funds released successfully",
      data: releasedPayout,
    });
  });

  public updateBankDetails = asyncHandler(
    async (req: Request, res: Response) => {
      const { bankDetails } = req.body;

      if (!bankDetails || !bankDetails.accountNumber || !bankDetails.ifscCode) {
        const error: any = new Error(
          "Account number and IFSC code are required",
        );
        error.statusCode = 400;
        throw error;
      }

      const shop = await MedicalShop.findOneAndUpdate(
        { id: req.shop?.id },
        { $set: { bankDetails } },
        { new: true, runValidators: true },
      );

      if (!shop) {
        const error: any = new Error("Shop not found");
        error.statusCode = 404;
        throw error;
      }

      res.json({
        success: true,
        message: "Bank details updated successfully",
        data: shop.bankDetails,
      });
    },
  );
}

export default ShopController.getInstance();
