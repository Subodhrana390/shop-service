import { Router } from "express";
import internalShopController from "../controllers/internalShop.controller.js";

const {
  getShopByOwnerId,
  getShopDetails,
  updateVerificationStatus,
  verifyShopOwner,
  getBatchShopDetails
} = internalShopController;

const router = Router();

router.get("/owner/:ownerId", getShopByOwnerId);
router.get("/details/:shopId", getShopDetails);
router.get("/verify-owner/:userId/:shopId", verifyShopOwner);
router.get("/shops/verify-owner/:userId/:shopId", verifyShopOwner);
router.get("/batch", getBatchShopDetails);
router.patch("/:shopId/verification", updateVerificationStatus);

export default router;
