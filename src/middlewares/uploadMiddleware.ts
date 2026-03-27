import multer, {
  FileFilterCallback,
  MulterError,
  StorageEngine,
} from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";
import { Request, Response, NextFunction } from "express";

const createCloudinaryStorage = (folderInfo: string) => {
  return new CloudinaryStorage({
    cloudinary: (cloudinary as any),
    params: async (req: Request, file: Express.Multer.File) => {
      const fileExtension = file.mimetype.split("/")[1] || "jpg";
      return {
        folder: `medicine-finder/shops/${folderInfo}`,
        public_id: `${Date.now()}-${file.originalname.split(".")[0].replace(/[^a-zA-Z0-9]/g, "_")}`,
        format: fileExtension === "pdf" ? "pdf" : undefined, // let Cloudinary auto-detect for images, specify for pdf
      };
    },
  });
};

const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const documentFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Only PDF and image files are allowed for documents")
    );
  }
};

export const uploadShopImages = multer({
  storage: createCloudinaryStorage("images"),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 5,
  },
});

export const uploadMedicineImages = multer({
  storage: createCloudinaryStorage("medicines"),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 3,
  },
});

export const uploadShopDocuments = multer({
  storage: createCloudinaryStorage("documents"),
  fileFilter: documentFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3,
  },
});

export const uploadShopOwnerApplication = multer({
  storage: createCloudinaryStorage("applications"),
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const isImage = file.mimetype.startsWith("image/");
    const isPDF = file.mimetype === "application/pdf";
    if (isImage || isPDF) {
      cb(null, true);
    } else {
      cb(new Error("Only images and PDF files are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const processImages = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Cloudinary handles image processing (resizing/optimizing) via its delivery URLs.
  // We can skip the local sharp processing.
  next();
};

export const validateUploads = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    const error = new Error("No files uploaded") as Error & {
      statusCode?: number;
    };
    error.statusCode = 400;
    return next(error);
  }
  next();
};

export const handleMulterError = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof MulterError) {
    let message = "File upload error";

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large";
        break;
      case "LIMIT_FILE_COUNT":
        message = "Too many files";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        break;
    }

    const error = new Error(message) as Error & {
      statusCode?: number;
    };
    error.statusCode = 400;
    return next(error);
  }

  next(err);
};