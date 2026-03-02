import { Request, Response } from "express";
import * as UserService from "../services/user.service";
import { sendResponse } from "../utils/api.response";

export const getProfile = async (req: any, res: Response , next : any) => {
  try {
    const user = await UserService.getUserProfile(req.user._id);

    return sendResponse(
      res,
      200,
      true,
      "User profile fetched successfully",
      user
    );
  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND") {
      return sendResponse(res, 404, false, "User not found");
    }

    next(err);
  }
};

export const updateProfile = async (req: any, res: Response ,next : any) => {
  try {
    const { name } = req.body;

    const updatedUser = await UserService.updateUserProfile(req.user._id, {
      name,
    });

    return sendResponse(
      res,
      200,
      true,
      "Profile updated successfully",
      updatedUser
    );
  } catch (err: any) {
    if (err.message === "USER_NOT_FOUND") {
      return sendResponse(res, 404, false, "User not found");
    }

     next(err);
  }
};

export const saveFcmToken = async (req: any, res: Response) => {
  try {
    const { fcmToken } = req.body;

    const tokens = await UserService.saveFcmTokenService(
      req.user._id,
      fcmToken
    );

    return sendResponse(res , 200 , true , "FCM token stored successfully" , {fcmTokens : tokens})

  } catch (error: any) {

    return sendResponse(res , 500 , false , "Failed to store FCM token");
  }
};