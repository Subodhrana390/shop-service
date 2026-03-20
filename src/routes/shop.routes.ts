import { Router } from "express";
import shopController from "../controllers/shop.controller.js";
import { validateQuery } from "../utils/index.js";
import { shopSearchSchema } from "../validators/shopValidator.js";

const { getShopById, getShops } = shopController;

const router = Router();

router.get(
  "/",
  validateQuery(shopSearchSchema) as any,
  getShops
);

router.get(
  "/:shopId",
  getShopById
);

export default router;