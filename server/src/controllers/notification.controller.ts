import { Request, Response, NextFunction } from "express";
import Notification from "../models/Notification.model";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";
import mongoose from "mongoose";

export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Notification.countDocuments({ recipient: userId });

    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.MESSAGES_FETCHED], {
      notifications,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    }, undefined, SuccessCode.MESSAGES_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const { notificationId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(notificationId as string)) {
      throw new Error("Invalid notificationId");
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(notificationId as string), recipient: userId },
      { $set: { isRead: true } },
      { new: true }
    );

    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.MARK_AS_READ], notification, undefined, SuccessCode.MARK_AS_READ);
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;

    await Notification.updateMany(
      { recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.MARK_ALL_AS_READ], null, undefined, SuccessCode.MARK_ALL_AS_READ);
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;

    const count = await Notification.countDocuments({ recipient: userId, isRead: false });

    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.UNREAD_COUNT], { count }, undefined, SuccessCode.UNREAD_COUNT);
  } catch (error) {
    next(error);
  }
};
