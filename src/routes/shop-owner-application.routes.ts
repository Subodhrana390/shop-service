import { Router } from "express";
import { shopApplicationController } from "../controllers/shop-application.controller.js";
import { authorize, protect } from "../middlewares/authMiddleware.js";
import { uploadShopOwnerApplication } from "../middlewares/uploadMiddleware.js";
import { validateShopOwnerFiles } from "../middlewares/validate-shop-owner-files.middleware.js";

const router = Router();

router.use(protect);

router.get("/application", shopApplicationController.getShopApplication);

router.post(
  "/apply-to-become-shopOwner",
  uploadShopOwnerApplication.fields([
    { name: "images", maxCount: 5 },
    { name: "license", maxCount: 1 },
    { name: "gstCertificate", maxCount: 1 },
    { name: "addressProof", maxCount: 1 },
    { name: "identityProof", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
  ]),
  validateShopOwnerFiles,
  shopApplicationController.applyToBecomeShopOwner,
);

router.patch(
  "/admin/:applicationId/review",
  authorize("admin") as any,
  shopApplicationController.reviewShopOwnerApplication,
);

export default router;
