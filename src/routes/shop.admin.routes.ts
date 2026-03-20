import { Router } from "express";
import shopController from "../controllers/shop.controller.js";
import { protect, authorize } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @route   PATCH /api/v1/shops/admin/:shopId/verify
 * @desc    Verify or reject a medical shop
 * @access  Private (Admin)
 */
router.patch(
    "/:shopId/verify",
    protect,
    authorize("admin"),
    shopController.verifyShop
);

export default router;
