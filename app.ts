import cors from "cors";
import express, { Express, Request, Response } from "express";
import helmet from "helmet";
import path from "path";
import { errorHandler } from "./src/middlewares/errorMiddleware.js";
import shopApplicationRouter from "./src/routes/shop-owner-application.routes.js";
import shopAdminRouter from "./src/routes/shop.admin.routes.js";
import internalRouter from "./src/routes/shop.internal.routes.js";
import shopOwnerRouter from "./src/routes/shop.owner.routes.js";
import shopPublicRouter from "./src/routes/shop.routes.js";

const app: Express = express();

app.use(helmet());
app.use(
  cors({
    origin: "*",
  }),
);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (req: Request, res: Response) => {
  res.json({
    service: "medical-shop-service",
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});
app.use("/api/v1/shops/public", shopPublicRouter);
app.use("/api/v1/shops/me", shopOwnerRouter);
app.use("/api/v1/shops/apply", shopApplicationRouter);
app.use("/api/v1/shops/admin", shopAdminRouter);
app.use("/api/v1/internal/shops", internalRouter);

app.use(errorHandler);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

export default app;
