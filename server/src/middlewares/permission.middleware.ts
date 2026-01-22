import { Response, NextFunction, Request } from "express";
import { sendResponse } from "../utils/api.response";

// Define the middleware type with ownerOrRole
type PermitMiddleware = ((req: Request, res: Response, next: NextFunction) => void) & {
  ownerOrRole: (getOwnerId: (req: Request) => string) => (req: Request, res: Response, next: NextFunction) => void;
};

export const permit = (...roles: string[]): PermitMiddleware => {
  const middleware = (req: any, res: Response, next: NextFunction) => {
    if (!roles.includes(req.userRole)) {
      return sendResponse(res, 403, false, "Access Denied");
    }
    next();
  };

  // Add ownerOrRole method
  middleware.ownerOrRole = (getOwnerId: (req: Request) => string) => {
    return (req: any, res: Response, next: NextFunction) => {
      // If user has one of the roles, allow
      if (roles.includes(req.userRole)) {
        return next();
      }

      // If user is owner, allow
      if (req.userId && req.userId.toString() === getOwnerId(req)) {
        return next();
      }

      return sendResponse(res, 403, false, "Access Denied");
    };
  };

  return middleware;
};
