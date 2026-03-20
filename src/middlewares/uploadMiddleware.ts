import multer, {
  FileFilterCallback,
  MulterError,
  StorageEngine,
} from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

const createUploadDir = (dir: string): void => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const createStorage = (destination: string): StorageEngine => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join("uploads", destination);
      createUploadDir(uploadPath);
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix =
        Date.now() + "-" + Math.round(Math.random() * 1e9);
      const extension = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${extension}`);
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
  storage: createStorage("shops"),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 5,
  },
});

export const uploadMedicineImages = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 3,
  },
});

export const uploadShopDocuments = multer({
  storage: createStorage("documents/shops"),
  fileFilter: documentFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 3,
  },
});

export const uploadShopOwnerApplication = multer({
  storage: createStorage("shop-owner"),
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
  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) return next();

  try {
    const processedFiles: Express.Multer.File[] = [];

    for (const file of files) {
      const inputPath = file.path;
      const outputPath = path.join(
        path.dirname(inputPath),
        "processed-" + path.basename(inputPath)
      );

      await sharp(inputPath)
        .resize(800, 600, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      fs.unlinkSync(inputPath);
      fs.renameSync(outputPath, inputPath);

      processedFiles.push({
        ...file,
        path: inputPath,
        size: fs.statSync(inputPath).size,
      });
    }

    req.files = processedFiles;
    next();
  } catch (error) {
    if (files) {
      files.forEach((file) => {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    const err = new Error("Image processing failed") as Error & {
      statusCode?: number;
    };
    err.statusCode = 500;
    next(err);
  }
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