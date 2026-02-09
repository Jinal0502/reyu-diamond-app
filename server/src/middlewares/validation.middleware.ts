import { Request, Response, NextFunction } from "express";
import { ZodError, ZodSchema } from "zod";
import { sendResponse } from "../utils/api.response";

export const validate =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (err: any) {
      if (err instanceof ZodError) {
        const errors = err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return sendResponse(res, 400, false, "Validation Error", errors);
      }

      next(err);
    }
  };

export const validateKycFiles = (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const files = req.files as {
    aadhaar?: Express.Multer.File[];
    pan?: Express.Multer.File[];
    selfie?: Express.Multer.File[];
  };

  if (!files?.aadhaar || files.aadhaar.length === 0) {
    return sendResponse(res, 400, false, "Aadhaar document is required", null);
  }

  if (!files?.pan || files.pan.length === 0) {
    return sendResponse(res, 400, false, "PAN document is required", null);
  }

  // selfie is optional (no validation needed)

  next();
};