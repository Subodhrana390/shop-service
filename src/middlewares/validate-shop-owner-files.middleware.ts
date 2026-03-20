import { Request, Response, NextFunction } from "express";

export const validateShopOwnerFiles = (req: Request, res: Response, next: NextFunction) => {
    const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};

    const requiredFields = [
        "images",
        "license",
        "gstCertificate",
        "identityProof",
        "panCard",
        "ownerPhoto",
        "addressProof",
    ];

    for (const field of requiredFields) {
        if (!files[field] || files[field].length === 0) {
            return res.status(400).json({
                success: false,
                message: `${field} file is required`,
            });
        }
    }

    const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedDocTypes = ["application/pdf", ...allowedImageTypes];

    for (const image of files.images) {
        if (!allowedImageTypes.includes(image.mimetype)) {
            return res.status(400).json({
                success: false,
                message: "Shop images must be JPG, PNG, or WEBP",
            });
        }
    }

    const documentFields = [
        "license",
        "gstCertificate",
        "identityProof",
        "panCard",
        "ownerPhoto",
        "addressProof",
    ];

    for (const field of documentFields) {
        const file = files[field][0];
        if (!allowedDocTypes.includes(file.mimetype)) {
            return res.status(400).json({
                success: false,
                message: `${field} must be a PDF or image`,
            });
        }
    }

    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    for (const field in files) {
        for (const file of files[field]) {
            if (file.size > MAX_SIZE) {
                return res.status(400).json({
                    success: false,
                    message: `${file.originalname} exceeds 5MB size limit`,
                });
            }
        }
    }

    next();
};
