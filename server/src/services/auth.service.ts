import { User } from "../models/User.model";
import { KYC } from "../models/Kyc.model";
import { sendEmail } from "../services/email.service";
import {
  otpEmailTemplate,
  passwordResetOtpTemplate,
} from "../utils/templates/email.template";
import { setUserOtp, CustomError, HTTP_STATUS, ErrorCode } from "../utils/index";
import logger from "../utils/logger";

interface LoginResult {
  _id: string;
  name: string;
  email: string;
  role: string;
  isKycVerified: boolean;
  isEmailVerified: boolean;
  kycStatus: string;
}

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new CustomError("User already exists with this email", HTTP_STATUS.CONFLICT, ErrorCode.USER_ALREADY_EXISTS);
  }

  const user = await User.create({ name, email, password });

  const otp = await setUserOtp(user, 10, "EMAIL_VERIFY");

  await sendEmail({
    to: email,
    subject: "Verify your email",
    htmlContent: otpEmailTemplate(otp),
  });

  logger.info("User registered, OTP sent", { email });
  return { email: user.email, message: "OTP sent to email" };
};

export const verifyEmailOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email }).select(
    "+otp +otpExpiresAt +otpPurpose"
  );

  if (!user) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  if (!user.otp || !user.otpExpiresAt || user.otpPurpose !== "EMAIL_VERIFY") {
    throw new CustomError("Invalid OTP request", HTTP_STATUS.BAD_REQUEST, ErrorCode.OTP_REQUEST_INVALID);
  }

  if (new Date() > user.otpExpiresAt) {
    throw new CustomError("OTP expired", HTTP_STATUS.BAD_REQUEST, ErrorCode.OTP_EXPIRED);
  }

  if (String(user.otp) !== String(otp)) {
    throw new CustomError("Invalid OTP", HTTP_STATUS.BAD_REQUEST, ErrorCode.OTP_INVALID);
  }

  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  user.otpPurpose = undefined;

  await user.save();

  logger.info("Email verified successfully", { email });
  return { email: user.email, message: "Email verified successfully" };
};

export const resentEmailOtp = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  const otp = await setUserOtp(user, 10, "EMAIL_VERIFY");

  await sendEmail({
    to: email,
    subject: "Verify your email",
    htmlContent: otpEmailTemplate(otp),
  });

  logger.info("OTP resent for email verification", { email });
  return { email: user.email, message: "OTP resent to email" };
};

export const loginUser = async (
  email: string,
  password: string
): Promise<LoginResult> => {
  const user = await User.findOne({ email }).select(
    "+password +otp +otpExpiresAt +otpPurpose +isEmailVerified"
  );

  if (!user) {
    throw new CustomError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new CustomError("Invalid email or password", HTTP_STATUS.UNAUTHORIZED, ErrorCode.INVALID_CREDENTIALS);
  }

  // if email not verified send otp again
  if (!user.isEmailVerified) {
    if (
      !user.otp ||
      !user.otpExpiresAt ||
      new Date() > user.otpExpiresAt ||
      user.otpPurpose !== "EMAIL_VERIFY"
    ) {
      const otp = await setUserOtp(user, 10, "EMAIL_VERIFY");

      await sendEmail({
        to: user.email,
        subject: "Verify your email",
        htmlContent: otpEmailTemplate(otp),
      });
    }

    throw new CustomError("Email not verified. OTP sent to your email.", HTTP_STATUS.FORBIDDEN, ErrorCode.EMAIL_NOT_VERIFIED);
  }

  const kyc = await KYC.findOne({ userId: user._id }).select("status");

  logger.info("User logged in", { userId: user._id, email: user.email, role: user.role });

  const isAdmin = user.role === "admin";

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isKycVerified: user.isKycVerified,
    isEmailVerified: user.isEmailVerified,
    kycStatus: isAdmin ? "approved" : kyc?.status || "not_submitted",
  };
};

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  const otp = await setUserOtp(user, 10, "PASSWORD_RESET");

  await sendEmail({
    to: email,
    subject: "Password Reset OTP",
    htmlContent: passwordResetOtpTemplate(otp),
  });

  logger.info("Password reset OTP sent", { email });
  return { email: user.email, message: "OTP sent to email" };
};

export const resetPasswordWithOtp = async (
  email: string,
  otp: string,
  newPassword: string
) => {
  const user = await User.findOne({ email }).select(
    "+otp +otpExpiresAt +otpPurpose"
  );

  if (!user) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  if (!user.otp || !user.otpExpiresAt || user.otpPurpose !== "PASSWORD_RESET") {
    throw new CustomError("Invalid OTP request", HTTP_STATUS.BAD_REQUEST, ErrorCode.OTP_REQUEST_INVALID);
  }

  if (new Date() > user.otpExpiresAt) {
    throw new CustomError("OTP expired", HTTP_STATUS.BAD_REQUEST, ErrorCode.OTP_EXPIRED);
  }

  if (String(user.otp) !== String(otp)) {
    throw new CustomError("Invalid OTP", HTTP_STATUS.BAD_REQUEST, ErrorCode.OTP_INVALID);
  }

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  user.otpPurpose = undefined;

  await user.save();

  logger.info("Password reset successfully", { email });
  return { email: user.email, message: "Password reset successful" };
};
