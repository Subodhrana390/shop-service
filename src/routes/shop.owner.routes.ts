import { Router } from "express";
import shopController from "../controllers/shop.controller.js";

const {
  getMyMedicalShop,
  getShopDashboard,
  updateShop,
  updateShopStatus,
  uploadShopImagesById,
} = shopController;

import {
    protect,
    requireShopOwnership,
} from "../middlewares/authMiddleware.js";

import {
    handleMulterError,
    uploadShopImages as shopImagesUpload,
    validateUploads,
} from "../middlewares/uploadMiddleware.js";

import {
    updateShopSchema,
    updateShopStatusSchema,
} from "../validators/shopValidator.js";

import { validate } from "../utils/index.js";

const router = Router();

router.use(protect, requireShopOwnership);

router.get("/", getMyMedicalShop);

router.put("/", validate(updateShopSchema) as any, updateShop);

router.patch(
  "/status",
  validate(updateShopStatusSchema) as any,
  updateShopStatus,
);

router.get("/dashboard", getShopDashboard);

router.post(
  "/images",
  shopImagesUpload.array("images", 5),
  validateUploads as any,
  uploadShopImagesById,
);

router.post("/escrow/:payoutId/release", shopController.releaseEscrow);
router.patch("/bank-details", shopController.updateBankDetails);

router.use(handleMulterError as any);

export default router;
