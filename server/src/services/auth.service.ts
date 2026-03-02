import { User } from "../models/User.model";
import { KYC } from "../models/Kyc.model";
import { sendEmail } from "../services/email.service";
import {
  otpEmailTemplate,
  passwordResetOtpTemplate,
} from "../utils/templates/email.template";
import { setUserOtp , CustomError } from "../utils/index";

interface LoginResult {
  _id: string;
  name: string;
  email: string;
  role: string;
  isKycVerified: boolean;
  isEmailVerified: boolean;
  kycStatus : string;
}

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => {
  const userExists = await User.findOne({ email });

  if (userExists) {
    throw new CustomError("User already exists with this email" , 409);
  }

  const user = await User.create({ name, email, password });

  const otp = await setUserOtp(user, 10, "EMAIL_VERIFY");

  await sendEmail({
    to: email,
    subject: "Verify your email",
    htmlContent: otpEmailTemplate(otp),
  });

  return { email: user.email, message: "OTP sent to email" };
};

export const verifyEmailOtp = async (email: string, otp: string) => {
  const user = await User.findOne({ email }).select(
    "+otp +otpExpiresAt +otpPurpose"
  );

  if (!user) {
    throw new CustomError("User not found" , 404);
  }

  if (!user.otp || !user.otpExpiresAt || user.otpPurpose !== "EMAIL_VERIFY") {
    throw new CustomError("Invalid OTP request" , 400);
  }

  if (new Date() > user.otpExpiresAt) {
    throw new CustomError( "OTP expired" , 400);
  }

  if (String(user.otp) !== String(otp)) {
    throw new CustomError( "Invalid OTP" , 400);
  }

  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  user.otpPurpose = undefined;

  await user.save();

  return { email: user.email, message: "Email verified successfully" };
};

export const resentEmailOtp = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError("User not found" , 404);
  }

  const otp = await setUserOtp(user, 10, "EMAIL_VERIFY");

  await sendEmail({
    to: email,
    subject: "Verify your email",
    htmlContent: otpEmailTemplate(otp),
  });

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
    throw new CustomError("Invalid email or password", 401);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new CustomError("Invalid email or password", 401);
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

    throw new CustomError("Email not verified. OTP sent to your email.", 403);
  }

  
  const kyc = await KYC.findOne({ userId: user._id }).select("status");

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isKycVerified: user.isKycVerified,
    isEmailVerified: user.isEmailVerified,

    // if kyc is not found return "NOT_SUBMITTED" (or null)
    kycStatus: kyc?.status || "not_submitted",
  };
};

export const forgotPassword = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new CustomError("User not found" , 404);
  }

  const otp = await setUserOtp(user, 10, "PASSWORD_RESET");

  await sendEmail({
    to: email,
    subject: "Password Reset OTP",
    htmlContent: passwordResetOtpTemplate(otp),
  });

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
    throw new CustomError("User not found" , 404);
  }

  if (!user.otp || !user.otpExpiresAt || user.otpPurpose !== "PASSWORD_RESET") {
    throw new CustomError("Invalid OTP request", 400);
  }

  if (new Date() > user.otpExpiresAt) {
    throw new CustomError("OTP expired" , 400);
  }

  if (String(user.otp) !== String(otp)) {
    throw new CustomError("Invalid OTP" , 400);
  }

  user.password = newPassword;
  user.otp = undefined;
  user.otpExpiresAt = undefined;
  user.otpPurpose = undefined;

  await user.save();

  return { email: user.email, message: "Password reset successful" };
};
