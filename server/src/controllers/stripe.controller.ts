import { NextFunction, Response } from "express";
import { createStripeConnectedAccountService , generateOnboardingLinkService , checkStripeAccountStatusService  } from "../services/stripe.service";
import { sendResponse } from "../utils/api.response";

export const createConnectedAccount = async (req: any, res: Response , next : NextFunction) => {
  try {
    const userId = req.user._id;

    const result = await createStripeConnectedAccountService(userId);

    if (result.alreadyExists) {
      return res.status(200).json({
        success: true,
        message: "Stripe account already exists",
        accountId: result.accountId,
      });
    }

    return sendResponse(res , 201 , true , "Stripe connected account created successfully" , {accountId : result.accountId});
  } 
  catch (error: any) {
    next(error);
  }
};

export const createOnboardingLink = async (req: any, res: Response , next : NextFunction) => {
  try {
    const userId = req.user._id;

    const result = await generateOnboardingLinkService(userId);

    return sendResponse(res , 200 , true , "Stripe onboarding link generated successfully", {url : result.url});
  } 
  catch (error: any) {

    next(error);
  }
};

export const checkStripeAccountStatusController = async (req: any, res: Response , next : NextFunction) => {
  try {
    const userId = req.user._id;

    const data = await checkStripeAccountStatusService(userId);

    return sendResponse(res , 200 , true , "Stripe account status fetched successfully", data);
  } catch (error: any) {
     next(error);
  }
};
