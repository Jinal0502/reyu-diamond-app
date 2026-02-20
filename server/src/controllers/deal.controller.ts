import { Request, Response, NextFunction } from "express";
import * as DealService from "../services/deal.service";
import { sendResponse } from "../utils/api.response";
import { CustomError } from "../utils/customError.utility";

export const getDeal = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deal = await DealService.getDealByIdService(
      req.params.dealId as string,
      req.user._id.toString(),
      req.userRole
    );

    return sendResponse(res, 200, true, "Deal fetched successfully", deal);
  } catch (error) {
    next(error);
  }
};

export const listDeals = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const deals = await DealService.getDealsForUserService(
      req.user._id.toString(),
      req.userRole
    );

    return sendResponse(res, 200, true, "Deals fetched successfully", deals);
  } catch (error) {
    next(error);
  }
};

export const markShipped = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { courier, trackingNumber, note } = req.body;

    const deal = await DealService.updateDealStatusService(
      req.params.dealId,
      "SHIPPED",
      req.user._id.toString(),
      req.userRole,
      note,
      { courier, trackingNumber }
    );

    res.status(200).json({
      success: true,
      message: "Deal marked as shipped",
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};

export const confirmDelivered = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { note } = req.body;

    const deal = await DealService.updateDealStatusService(
      req.params.dealId,
      "DELIVERED",
      req.user._id.toString(),
      req.userRole,
      note
    );

    res.status(200).json({
      success: true,
      message: "Delivery confirmed",
      data: deal,
    });
  } catch (error) {
    next(error);
  }
};


export const cancelDeal = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await DealService.cancelDealService(
      req.params.dealId,
      req.user._id.toString(),
      req.userRole
    );

    return sendResponse(res, 200, true, "Deal cancelled successfully", result);
  } catch (error) {
    next(error);
  }
};

export const raiseDispute = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      throw new Error("Dispute reason is required");
    }

    const deal = await DealService.raiseDisputeService(
      req.params.dealId,
      reason,
      req.user._id.toString(),
      req.userRole
    );

    return sendResponse(res, 200, true, "Dispute raised successfully", deal);
  } catch (error) {
    next(error);
  }
};
export const resolveDispute = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { resolution, adminNote } = req.body;

    if (!resolution) {
      throw new Error("Resolution is required");
    }

    const result = await DealService.resolveDisputeService(
      req.params.dealId,
      resolution,
      adminNote || "",
      req.user._id.toString(),
      req.userRole
    );

    return sendResponse(res, 200, true, "Dispute resolved successfully", result);
  } catch (error) {
    next(error);
  }
};