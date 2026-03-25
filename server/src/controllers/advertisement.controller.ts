import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as AdServices from "../services/advertisement.service";
import { sendResponse, CustomError, ErrorCode, HTTP_STATUS, SuccessCode, SUCCESS_MESSAGES } from "../utils";

const param = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

export const requestAdController = async (req: any, res: Response, next: NextFunction) => {
  try {
    const ad = await AdServices.requestAdService({ advertiserId: req.user._id, payload: req.body });
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.AD_REQUESTED], ad, undefined, SuccessCode.AD_REQUESTED);
  } catch (error) {
    next(error);
  }
};

export const getMyAdsController = async (req: any, res: Response, next: NextFunction) => {
  try {
    const ads = await AdServices.getUserAdsService(req.user._id);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.ADS_FETCHED], ads, undefined, SuccessCode.ADS_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getActiveAdsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ads = await AdServices.getActiveAdsService(req.query.section as string);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.ADS_FETCHED], ads, undefined, SuccessCode.ADS_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getAdByIdController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(adId)) {
      throw new CustomError("Invalid ad id", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }
    const ad = await AdServices.getAdByIdService(new mongoose.Types.ObjectId(param(adId)));
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.AD_FETCHED], ad, undefined, SuccessCode.AD_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const updateAdStatusController = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { adId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(adId)) {
      throw new CustomError("Invalid ad id", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }
    const updated = await AdServices.updateAdStatusService({
      adId: new mongoose.Types.ObjectId(param(adId)),
      adminId: req.user._id,
      payload: req.body,
    });
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.AD_STATUS_UPDATED], updated, undefined, SuccessCode.AD_STATUS_UPDATED);
  } catch (error) {
    next(error);
  }
};

export const clickAdController = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { adId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(adId)) {
      throw new CustomError("Invalid ad id", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }
    const redirectUrl = await AdServices.clickAdService({
      adId: new mongoose.Types.ObjectId(param(adId)),
      currentUserId: req.user?._id,
    });
    return res.redirect(302, redirectUrl);
  } catch (error) {
    next(error);
  }
};
