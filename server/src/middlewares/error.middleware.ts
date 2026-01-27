import { Request, Response, NextFunction } from "express";
import { sendResponse } from "../utils/api.response";

export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) => {

  if (res.headersSent) {
    return next(err);
  }

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

    return sendResponse(res, 409, false, message, null);
  }

  const statusCode = err.statusCode || 500;

  const message =
    process.env.NODE_ENV === "production"
      ? "Internal Server Error"
      : err.message || "Something went wrong";

  return sendResponse(res, statusCode, false, message, null);
};
