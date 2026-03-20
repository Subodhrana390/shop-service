import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import MedicalShop from "../models/MedicalShop.js";

class InternalShopController {
  private static instance: InternalShopController;

  private constructor() {}

  public static getInstance(): InternalShopController {
    if (!InternalShopController.instance) {
      InternalShopController.instance = new InternalShopController();
    }
    return InternalShopController.instance;
  }

  public getShopByOwnerId = asyncHandler(
    async (req: Request, res: Response) => {
      const { ownerId } = req.params;

      const shop = await MedicalShop.findOne({ ownerId });

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
      const shop = await MedicalShop.findOne({
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

    const shop = await MedicalShop.findOne({
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
    const shop = await MedicalShop.findOne({ id: req.params.shopId });

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
}

export default InternalShopController.getInstance();
