import { Request, Response, NextFunction } from "express";
import * as DealService from "../services/deal.service";
import { sendResponse, CustomError, ErrorCode, HTTP_STATUS, SuccessCode, SUCCESS_MESSAGES } from "../utils";

const param = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

export const getDeal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deal = await DealService.getDealByIdService(
      param(req.params.dealId),
      req.user._id.toString(),
      req.userRole
    );
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.DEAL_FETCHED], deal, undefined, SuccessCode.DEAL_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const listDeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deals = await DealService.getDealsForUserService(req.user._id.toString(), req.userRole);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.DEALS_FETCHED], deals, undefined, SuccessCode.DEALS_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const markShipped = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { courier, trackingNumber, note } = req.body;
    const deal = await DealService.updateDealStatusService(
      param(req.params.dealId), "SHIPPED", req.user._id.toString(), req.userRole, note, { courier, trackingNumber }
    );
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.DEAL_SHIPPED], deal, undefined, SuccessCode.DEAL_SHIPPED);
  } catch (error) {
    next(error);
  }
};

export const confirmDelivered = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { note } = req.body;
    const deal = await DealService.updateDealStatusService(
      param(req.params.dealId), "DELIVERED", req.user._id.toString(), req.userRole, note
    );
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.DEAL_DELIVERED], deal, undefined, SuccessCode.DEAL_DELIVERED);
  } catch (error) {
    next(error);
  }
};

export const cancelDeal = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await DealService.cancelDealService(
      param(req.params.dealId), req.user._id.toString(), req.userRole
    );
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.DEAL_CANCELLED], result, undefined, SuccessCode.DEAL_CANCELLED);
  } catch (error) {
    next(error);
  }
};

export const raiseDispute = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      throw new CustomError("Dispute reason is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }
    const deal = await DealService.raiseDisputeService(
      param(req.params.dealId), reason, req.user._id.toString(), req.userRole
    );
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.DISPUTE_RAISED], deal, undefined, SuccessCode.DISPUTE_RAISED);
  } catch (error) {
    next(error);
  }
};

export const resolveDispute = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { resolution, adminNote } = req.body;
    if (!resolution) {
      throw new CustomError("Resolution is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }
    const result = await DealService.resolveDisputeService(
      param(req.params.dealId), resolution, adminNote || "", req.user._id.toString(), req.userRole
    );
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.DISPUTE_RESOLVED], result, undefined, SuccessCode.DISPUTE_RESOLVED);
  } catch (error) {
    next(error);
  }
};
