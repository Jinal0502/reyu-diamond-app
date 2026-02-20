import { Request , Response , NextFunction } from "express";
import { createPaymentIntentForDealService , releaseEscrowService } from "../services/escrow.service";
import { sendResponse } from "../utils/api.response";

export const createPaymentIntentForDeal = async (req: any, res: Response , next : NextFunction) => {
  try {
    const buyerId = req.user._id;
    const { dealId , note } = req.body;

    const data = await createPaymentIntentForDealService(dealId, buyerId , note);


    return sendResponse(res , 201 , true , "PaymentIntent created successfully" , data);
  } 
  catch (error: any) {
    next(error);
  }
};

export const releaseEscrow = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const dealId = req.params.dealId;
    const { note } = req.body;

    const result = await releaseEscrowService(
      dealId,
      req.user._id.toString(),
      req.userRole,
      note
    );

    return sendResponse(res, 200, true, "Payment released successfully", result);
  } catch (error) {
    next(error);
  }
};