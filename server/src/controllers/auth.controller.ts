import { NextFunction, Request, Response } from "express";
import * as AuthService from "../services/auth.service";
import { sendResponse, generateToken, SuccessCode, SUCCESS_MESSAGES } from "../utils/index";

export const register = async (req: Request, res: Response, next: any) => {
  try {
    const { name, email, password } = req.body;
    const data = await AuthService.registerUser(name, email, password);
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.REGISTERED], data, undefined, SuccessCode.REGISTERED);
  } catch (err: any) {
    next(err);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: any) => {
  try {
    const { email, otp } = req.body;
    const data = await AuthService.verifyEmailOtp(email, otp);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.EMAIL_VERIFIED], data, undefined, SuccessCode.EMAIL_VERIFIED);
  } catch (err: any) {
    next(err);
  }
};

export const resendOtp = async (req: Request, res: Response, next: any) => {
  try {
    const { email } = req.body;
    const data = await AuthService.resentEmailOtp(email);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.OTP_RESENT], data, undefined, SuccessCode.OTP_RESENT);
  } catch (err: any) {
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: any) => {
  try {
    const { email, password } = req.body;
    const user = await AuthService.loginUser(email, password);
    const token = generateToken({ userId: user._id, role: user.role });
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.LOGIN_SUCCESS], { token, user }, undefined, SuccessCode.LOGIN_SUCCESS);
  } catch (err: any) {
    next(err);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const data = await AuthService.forgotPassword(email);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.PASSWORD_RESET_OTP_SENT], data, undefined, SuccessCode.PASSWORD_RESET_OTP_SENT);
  } catch (err: any) {
    next(err);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp, newPassword } = req.body;
    const data = await AuthService.resetPasswordWithOtp(email, otp, newPassword);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.PASSWORD_RESET_SUCCESS], data, undefined, SuccessCode.PASSWORD_RESET_SUCCESS);
  } catch (err: any) {
    next(err);
  }
};

export const logout = async (_req: Request, res: Response) => {
  return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.LOGOUT_SUCCESS], undefined, undefined, SuccessCode.LOGOUT_SUCCESS);
};
