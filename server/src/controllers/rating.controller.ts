import { Request, Response, NextFunction } from "express";
import * as RatingService from "../services/rating.serivce";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";
import mongoose from "mongoose";

const param = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

export const createRatingController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rating = await RatingService.createRatingService({
      userId: new mongoose.Types.ObjectId(param(req.params.userId)),
      raterId: req.user._id,
      payload: req.body,
    });
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.RATING_SUBMITTED], rating, undefined, SuccessCode.RATING_SUBMITTED);
  } catch (error) {
    next(error);
  }
};

export const getRatingsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await RatingService.getRatingsService(new mongoose.Types.ObjectId(param(req.params.userId)));
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.RATINGS_FETCHED], data, undefined, SuccessCode.RATINGS_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getMyRatingsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await RatingService.getRatingsService(req.user._id.toString());
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.RATINGS_FETCHED], data, undefined, SuccessCode.RATINGS_FETCHED);
  } catch (error) {
    next(error);
  }
};
