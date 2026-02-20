import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import { getUserBadgesService } from "../services/badge.service";

export const getUserBadgesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.params.userId as string;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Invalid userId" });
    }

    const data = await getUserBadgesService(new mongoose.Types.ObjectId(userId));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getMyBadgesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user._id;

    const data = await getUserBadgesService(userId);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
