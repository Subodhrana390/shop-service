import { Request, Response } from "express";
import { shopApplicationService } from "../services/shop-application.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { shopDataSchema, reviewApplicationSchema } from "../validators/shop-owner-application.validator.js";

export class ShopApplicationController {
    getShopApplication = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const result = await shopApplicationService.getApplication(req.user.id);
        return res.status(200).json(new ApiResponse(200, result, "Shop application fetched successfully"));
    });

    applyToBecomeShopOwner = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};
        const data = shopDataSchema.parse(req.body);

        const application = await shopApplicationService.submitApplication(req.user.id, data, files);
        return res.status(201).json(new ApiResponse(201, application, "Application submitted successfully"));
    });

    reviewShopOwnerApplication = asyncHandler(async (req: Request, res: Response) => {
        if (!req.user) throw new Error("Not authenticated");
        const applicationId = req.params.applicationId as string;
        const parsed = reviewApplicationSchema.parse(req.body);

        const application = await shopApplicationService.reviewApplication(
            applicationId,
            req.user.id,
            parsed.status,
            parsed.rejectionReason
        );

        return res.status(200).json(new ApiResponse(200, application, `Application ${parsed.status} successfully`));
    });
}

export const shopApplicationController = new ShopApplicationController();
