import { Request, Response, NextFunction } from "express";
import { sendResponse, CustomError, ERROR_MESSAGES } from "../utils";
import multer from "multer";
import logger from "../utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (res.headersSent) {
    return next(err);
  }

  /* ================= MULTER ERRORS ================= */
  if (err instanceof multer.MulterError) {
    logger.warn("Multer upload error", { message: err.message, path: req.path });
    return sendResponse(res, 400, false, err.message, null);
  }

  /* ================= CUSTOM ERROR ================= */
  if (err instanceof CustomError) {
    logger.warn("Custom application error", {
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.errorCode,
      path: req.path,
      method: req.method,
    });
    // Use ERROR_MESSAGES lookup as the response message when available, fall back to err.message
    const message = (err.errorCode && ERROR_MESSAGES[err.errorCode]) || err.message;
    return sendResponse(res, err.statusCode, false, message, null, undefined, err.errorCode);
  }

  /* ================= MONGODB DUPLICATE KEY ================= */
  if (
    err?.code === 11000 ||
    err?.name === "MongoServerError" ||
    err?.message?.includes("E11000")
  ) {
    const fields = Object.keys(err.keyValue || {});
    const message =
      fields.length > 0
        ? `Duplicate value for field(s): ${fields.join(", ")}`
        : "Duplicate value detected";

    logger.warn("MongoDB duplicate key error", { fields, path: req.path });
    return sendResponse(res, 409, false, message, null);
  }

  /* ================= MONGOOSE VALIDATION ERROR ================= */
  if (err?.name === "ValidationError") {
    const errors: Record<string, string> = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });

    logger.warn("Mongoose validation error", { errors, path: req.path });
    return sendResponse(
      res,
      400,
      false,
      "Validation Failed",
      null,
      errors,
      "VALIDATION_ERROR"
    );
  }

  /* ================= DEFAULT ERROR ================= */
  const statusCode = err.statusCode || 500;

  logger.error("Unhandled server error", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Something went wrong";

  return sendResponse(res, statusCode, false, message, null);
};
