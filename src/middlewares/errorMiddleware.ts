import { NextFunction, Request, Response } from "express";
import { Error as MongooseError } from "mongoose";
import multer from "multer";
import { ZodError } from "zod";

/* ------------------ CUSTOM ERROR TYPE ------------------ */

interface AppError extends Error {
  statusCode?: number;
  code?: number | string;
  keyValue?: Record<string, any>;
  errors?: Record<string, any>;
  issues?: { message: string }[];
}

/* ------------------ GLOBAL ERROR HANDLER ------------------ */

export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction,
): Response => {
  console.error("🔥 Medical Shop Service Error:", err);

  /* -------- ZOD VALIDATION -------- */
  if (err instanceof ZodError) {
    const firstIssue = err.issues[0]?.message || "Validation failed";
    return res.status(400).json({
      success: false,
      message: firstIssue,
      errors: err.issues,
    });
  }

  /* -------- MONGOOSE DUPLICATE KEY -------- */
  if (err.code === 11000 && err.keyValue) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  /* -------- MONGOOSE VALIDATION -------- */
  if (err instanceof MongooseError.ValidationError) {
    const messages = Object.values(err.errors).map((val: any) => val.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: messages,
    });
  }

  /* -------- CAST ERROR -------- */
  if (err instanceof MongooseError.CastError) {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID format",
    });
  }

  /* -------- MULTER ERRORS -------- */
  if (err instanceof multer.MulterError) {
    let message = "File upload error";

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        message = "File too large. Maximum size allowed is 5MB";
        break;
      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected file field";
        break;
    }

    return res.status(400).json({
      success: false,
      message,
    });
  }

  /* -------- FALLBACK -------- */
  const statusCode = err.statusCode ?? 500;
  const message = err.message || "Internal Server Error";

  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
};
