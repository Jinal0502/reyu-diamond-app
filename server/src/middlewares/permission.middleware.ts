import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { sendResponse } from "../utils";
import logger from "../utils/logger";

export const permit =
  (...roles: string[]) =>
  (req: any, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return sendResponse(res, 403, false, "Access Denied");
    }
    next();
  };

export const ownerOrRole = (
  model: mongoose.Model<any>,
  ownerField: string = "userId",
  allowedRoles: string[] = ["admin"],
  paramKey: string = "id"
) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      // Role bypass
      if (req.userRole && allowedRoles.includes(req.userRole)) {
        return next();
      }

      const resourceId = req.params?.[paramKey];

      if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
        return sendResponse(res, 400, false, "Invalid resource identifier");
      }
      
      const resource = await model
        .findById(resourceId)
        .select(ownerField);
        
      if (!resource) {
        return sendResponse(res, 404, false, "Resource not found");
      }

      if (!resource[ownerField]) {
        return sendResponse(res, 403, false, "Ownership not defined");
      }

      if (resource[ownerField].toString() !== req.user._id.toString()) {
        return sendResponse(res, 403, false, "Access Denied");
      }

      // Attach resource if controller needs it
      req.resource = resource;

      next();
    } catch (error) {
      logger.error("Owner/role authorization error", { resourceId: req.params?.[paramKey], error });
      return sendResponse(res, 500, false, "Authorization failed");
    }
  };
};
