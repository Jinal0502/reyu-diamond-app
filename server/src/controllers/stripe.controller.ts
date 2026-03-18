import { NextFunction, Response } from "express";
import {
  createStripeConnectedAccountService,
  generateOnboardingLinkService,
  checkStripeAccountStatusService,
} from "../services/stripe.service";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";

export const createConnectedAccount = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await createStripeConnectedAccountService(req.user._id);

    if (result.alreadyExists) {
      return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.STRIPE_ACCOUNT_EXISTS], { accountId: result.accountId }, undefined, SuccessCode.STRIPE_ACCOUNT_EXISTS);
    }

    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.STRIPE_ACCOUNT_CREATED], { accountId: result.accountId }, undefined, SuccessCode.STRIPE_ACCOUNT_CREATED);
  } catch (error: any) {
    next(error);
  }
};

export const createOnboardingLink = async (req: any, res: Response, next: NextFunction) => {
  try {
    const result = await generateOnboardingLinkService(req.user._id);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.STRIPE_ONBOARDING_LINK], { url: result.url }, undefined, SuccessCode.STRIPE_ONBOARDING_LINK);
  } catch (error: any) {
    next(error);
  }
};

export const checkStripeAccountStatusController = async (req: any, res: Response, next: NextFunction) => {
  try {
    const data = await checkStripeAccountStatusService(req.user._id);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.STRIPE_STATUS_FETCHED], data, undefined, SuccessCode.STRIPE_STATUS_FETCHED);
  } catch (error: any) {
    next(error);
  }
};
