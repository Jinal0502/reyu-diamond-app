import { User } from "../models/User.model";
import mongoose from "mongoose";
import { CustomError, ErrorCode, HTTP_STATUS } from "../utils";
import logger from "../utils/logger";

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  return { user };
};

export const updateUserProfile = async (
  userId: string,
  payload: { name?: string }
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  if (payload.name) {
    user.name = payload.name;
  }

  await user.save();

  logger.info("User profile updated", { userId });
  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};

export const saveFcmTokenService = async (
  userId: mongoose.Types.ObjectId,
  fcmToken: string
) => {
  if (!fcmToken) {
    throw new CustomError("FCM token is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  // Use $addToSet for atomic, unique addition to the array
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $addToSet: { fcmTokens: fcmToken } },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  logger.info("FCM token stored successfully", { userId, token: fcmToken });
  return updatedUser.fcmTokens;
};
