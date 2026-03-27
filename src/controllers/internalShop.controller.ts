import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import Shop, { IShop, ILocation, } from "../models/Shop.js";

interface ShopDetails {
  id: string;
  name: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    location: ILocation;
  };
  contact: {
    phone: string;
  };
}

class InternalShopController {
  private static instance: InternalShopController;

  private constructor() { }

  public static getInstance(): InternalShopController {
    if (!InternalShopController.instance) {
      InternalShopController.instance = new InternalShopController();
    }
    return InternalShopController.instance;
  }

  public getShopByOwnerId = asyncHandler(
    async (req: Request, res: Response) => {
      const { ownerId } = req.params;

      const shop = await Shop.findOne({ ownerId });

      if (!shop) {
        res.status(404).json({
          success: false,
          message: "Shop not found",
        });
        return;
      }

      if (shop.status !== "active" || shop.verificationStatus !== "verified") {
        res.status(403).json({
          success: false,
          message: "Shop is not available",
        });
        return;
      }

      res.json({
        success: true,
        data: { id: shop.id },
      });
    },
  );

  public updateVerificationStatus = asyncHandler(
    async (req: Request, res: Response) => {
      const { status, note } = req.body;
      const shop = await Shop.findOne({
        id: req.params.shopId || req.shop?.id,
      });

      if (!shop) {
        res.status(404).json({ success: false, message: "Shop not found" });
        return;
      }

      shop.verificationStatus = status;
      if (status === "verified") shop.status = "active";

      await shop.save();

      res.json({
        success: true,
        message: `Shop verification updated to ${status}`,
      });
    },
  );

  public verifyShopOwner = asyncHandler(async (req: Request, res: Response) => {
    const { userId, shopId } = req.params;

    const shop = await Shop.findOne({
      id: req.params.shopId || req.shop?.id,
    });

    if (!shop) {
      res
        .status(404)
        .json({ success: false, isOwner: false, message: "Shop not found" });
      return;
    }

    const isOwner = shop.ownerId.toString() === userId.toString();

    res.json({
      success: true,
      isOwner,
      shop: isOwner ? { id: shop.id, status: shop.status } : null,
    });
  });

  public getShopDetails = asyncHandler(async (req: Request, res: Response) => {
    const shop = await Shop.findOne({ id: req.params.shopId });

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

    res.json({
      success: true,
      data: shop,
    });
  });

  public getBatchShopDetails = asyncHandler(
    async (req: Request, res: Response) => {

      const { shopIds } = req.body;

      /**
       * Validate input
       */
      if (!Array.isArray(shopIds) || shopIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "shopIds must be a non-empty array",
        });
      }

      /**
       * Remove duplicates
       */
      const uniqueShopIds = [...new Set(shopIds)];

      const shops = await Shop.find(
        { id: { $in: uniqueShopIds } },
        {
          id: 1,
          name: 1,
          "address.street": 1,
          "address.city": 1,
          "address.state": 1,
          "address.pincode": 1,
          "address.location": 1,
          "contactInfo.phone": 1,
        }
      ).lean();

      const shopMap = new Map(shops.map(shop => [shop.id, shop]));

      const shopDetails = uniqueShopIds
        .map(id => shopMap.get(id))
        .filter(Boolean)
        .map(shop => ({
          id: shop!.id,
          name: shop!.name,
          address: {
            street: shop!.address.street,
            city: shop!.address.city,
            state: shop!.address.state,
            pincode: shop!.address.pincode,
            location: shop!.address.location,
          },
          contact: {
            phone: shop!.contactInfo.phone,
          },
        }));


      return res.json({
        success: true,
        count: shopDetails.length,
        data: shopDetails,
      });
    }
  );
};


export default InternalShopController.getInstance();
