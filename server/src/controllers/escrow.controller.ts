import { Request, Response, NextFunction } from "express";
import { createPaymentIntentForDealService, releaseEscrowService } from "../services/escrow.service";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";

export const createPaymentIntentForDeal = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { dealId, note } = req.body;
    const data = await createPaymentIntentForDealService(dealId, req.user._id, note);
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.PAYMENT_INTENT_CREATED], data, undefined, SuccessCode.PAYMENT_INTENT_CREATED);
  } catch (error: any) {
    next(error);
  }
};

export const releaseEscrow = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { note } = req.body;
    const result = await releaseEscrowService(
      req.params.dealId as string, req.user._id.toString(), req.userRole, note
    );
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.ESCROW_RELEASED], result, undefined, SuccessCode.ESCROW_RELEASED);
  } catch (error) {
    next(error);
  }
};
