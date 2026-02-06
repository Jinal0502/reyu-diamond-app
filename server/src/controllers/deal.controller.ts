import { Request, Response, NextFunction } from "express";
import * as DealService from "../services/deal.service";
import { sendResponse } from "../utils/api.response";

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

export const updateDealStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status } = req.body;

    if (!status) {
      throw new Error("Status is required");
    }

    const deal = await DealService.updateDealStatusService(
      req.params.dealId as string,
      status,
      req.user._id.toString(),
      req.userRole
    );

    return sendResponse(
      res,
      200,
      true,
      "Deal status updated successfully",
      deal
    );
  } catch (error) {
    next(error);
  }
};
