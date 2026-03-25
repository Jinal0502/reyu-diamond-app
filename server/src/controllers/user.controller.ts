import { Request, Response } from "express";
import * as UserService from "../services/user.service";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";
import logger from "../utils/logger";

export const getProfile = async (req: any, res: Response, next: any) => {
  try {
    const user = await UserService.getUserProfile(req.user._id);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.PROFILE_FETCHED], user, undefined, SuccessCode.PROFILE_FETCHED);
  } catch (err: any) {
    next(err);
  }
};

export const updateProfile = async (req: any, res: Response, next: any) => {
  try {
    const { name } = req.body;
    const updatedUser = await UserService.updateUserProfile(req.user._id, { name });
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.PROFILE_UPDATED], updatedUser, undefined, SuccessCode.PROFILE_UPDATED);
  } catch (err: any) {
    next(err);
  }
};

export const saveFcmToken = async (req: any, res: Response, next: any) => {
  try {
    const { fcmToken } = req.body;
    const tokens = await UserService.saveFcmTokenService(req.user._id, fcmToken);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.FCM_TOKEN_SAVED], { fcmTokens: tokens }, undefined, SuccessCode.FCM_TOKEN_SAVED);
  } catch (error: any) {
    logger.error("Failed to store FCM token", { userId: req.user?._id, error });
    next(error);
  }
};
