import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import MedicalShop from "../models/Shop.js";

export const protect = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    const error = new Error("No token provided") as Error & {
      statusCode?: number;
    };
    error.statusCode = 401;
    return next(error);
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwt.accessSecret) as {
      id: string;
      role: "admin" | "shop-owner" | "user";
    };

    req.user = decoded;
    next();
  } catch (err) {
    const error = new Error("Invalid or expired token") as Error & {
      statusCode?: number;
    };
    error.statusCode = 401;
    next(error);
  }
};

/* ------------------ ROLE MIDDLEWARES ------------------ */

export const requireShopOwner = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "shop-owner") {
    const error = new Error(
      "Access denied. Shop owner privileges required.",
    ) as Error & { statusCode?: number };
    error.statusCode = 403;
    return next(error);
  }
  next();
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  if (req.user?.role !== "admin") {
    const error = new Error("Admin access required") as Error & {
      statusCode?: number;
    };
    error.statusCode = 403;
    return next(error);
  }
  next();
};

/* ------------------ SHOP OWNERSHIP ------------------ */

export const requireShopOwnership = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (!req.user) {
      const error = new Error("Unauthorized") as Error & {
        statusCode?: number;
      };
      error.statusCode = 401;
      return next(error);
    }

    const shop = await MedicalShop.findOne({
      ownerId: req.user.id,
    }).select("ownerId status id");

    if (!shop) {
      const error = new Error("Medical shop not found") as Error & {
        statusCode?: number;
      };
      error.statusCode = 404;
      return next(error);
    }

    if (shop.ownerId !== req.user.id) {
      const error = new Error(
        "Unauthorized: You do not own this shop",
      ) as Error & { statusCode?: number };
      error.statusCode = 403;
      return next(error);
    }

    req.shop = shop;
    next();
  } catch (err) {
    next(err);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      const error = new Error(
        "Access denied: insufficient permissions",
      ) as Error & { statusCode?: number };
      error.statusCode = 403;
      return next(error);
    }
    next();
  };
};
