import { User } from "../models/User.model";
import mongoose from "mongoose";
import { CustomError } from "../utils/customError.utility"

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId)

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return { user };
};

export const updateUserProfile = async (
  userId: string,
  payload: { name?: string }
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (payload.name) {
    user.name = payload.name;
  }

  await user.save();

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
    throw new CustomError("FCM token is required", 400);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError("User not found", 404);
  }

  // ✅ Prevent duplicate tokens
  const alreadyExists = user.fcmTokens?.includes(fcmToken);

  if (!alreadyExists) {
    user?.fcmTokens?.push(fcmToken);
    await user.save();
  }

  return user.fcmTokens;
};
