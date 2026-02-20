import { Request, Response, NextFunction } from "express";
import * as RatingService from "../services/rating.serivce";
import { sendResponse } from "../utils/api.response";
import mongoose from "mongoose";

export const createRatingController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId as string;
    const raterId = req.user._id;

    const rating = await RatingService.createRatingService({
      userId : new mongoose.Types.ObjectId(userId),
      raterId,
      payload: req.body,
    });

    return sendResponse(res, 201, true, "Rating submitted successfully", rating);
  } catch (error) {
    next(error);
  }
};

export const getRatingsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const  userId  = req.params.userId as string;

    const data = await RatingService.getRatingsService(new mongoose.Types.ObjectId(userId));

    return sendResponse(res, 200, true, "Ratings fetched successfully", data);
  } catch (error) {
    next(error);
  }
};

export const getMyRatingsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const myId = req.user._id.toString();
    const data = await RatingService.getRatingsService(myId);

    return sendResponse(res, 200, true, "My ratings fetched successfully", data);
  } catch (error) {
    next(error);
  }
};
