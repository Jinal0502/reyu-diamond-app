import { Request, Response, NextFunction } from "express";
import mongoose , {Types} from "mongoose";
import { Deal, IDeal } from "../models/Deal.model";
import { sendResponse } from "../utils/api.response";

interface DealRequest extends Request {
  deal?: IDeal;
  userRole: "user" | "admin";
}

export const canAccessDeal = async (
  req: DealRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const dealId = Array.isArray(req.params?.dealId) ? req.params.dealId[0] : req.params?.dealId;
    if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
      return sendResponse(res, 400, false, "Invalid deal id");
    }

    const deal = await Deal.findById(dealId).select("buyerId sellerId");
    
    if (!deal) {
      return sendResponse(res, 404, false, "Deal not found");
    }

    const userId = req.user._id.toString();
    const role = req.userRole;

    const isBuyer = deal.buyerId.toString() === userId;
    const isSeller = deal.sellerId.toString() === userId;
    const isAdmin = role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      return sendResponse(res, 403, false, "Access denied");
    }

    // Attach deal to req for downstream controllers
    req.deal = deal;

    next();
  } catch (error) {
    console.error("Deal access error:", error);
    return sendResponse(res, 500, false, "Authorization failed");
  }
};
