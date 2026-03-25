import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { getUserBadgesService } from "../services/badge.service";
import { sendResponse, CustomError, ErrorCode, HTTP_STATUS, SuccessCode, SUCCESS_MESSAGES } from "../utils";

const param = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

export const getUserBadgesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = param(req.params.userId);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new CustomError("Invalid userId", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }

    const data = await getUserBadgesService(new mongoose.Types.ObjectId(userId));
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.BADGES_FETCHED], data, undefined, SuccessCode.BADGES_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getMyBadgesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getUserBadgesService(req.user._id);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.BADGES_FETCHED], data, undefined, SuccessCode.BADGES_FETCHED);
  } catch (error) {
    next(error);
  }
};
