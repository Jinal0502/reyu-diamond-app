import { User } from "../models/User.model";
import crypto from "crypto";
import { sendEmail } from "../services/email.service";
import { otpEmailTemplate } from "../utils/templates/email.template";
import { setUserOtp } from "../utils/otp.utils";

interface LoginResult {
  _id: string;
  name: string;
  email: string;
  role: string;
  isKycVerified: boolean;
  isEmailVerified: boolean;
}

export const registerUser = async (
  name: string,
  email: string,
  password: string
) => 
    {
  const userExists = await User.findOne({ email });
  if (userExists) {
    throw new Error("USER_ALREADY_EXISTS");
  }

  const user = await User.create({ name, email, password });

  const otp = await setUserOtp(user , 10);

  await sendEmail({
      to: email,
      subject: "Verify your email",
      htmlContent: otpEmailTemplate(otp),
    });
  
  return { email: user.email, message: "OTP sent to email" };

};

export const verifyEmailOtp = async (email: string, otp: string) => {

  const user = await User.findOne({ email }).select("+otp +otpExpiresAt");
  
  if (!user) throw new Error("User Not Found");

  if (!user.otp || !user.otpExpiresAt) {
    throw new Error("Invalid or Expired OTP");
  }

  if (new Date() > user.otpExpiresAt) {
    throw new Error("OTP expired");
  }

  if (String(user.otp) !== String(otp)) {
    throw new Error("Invalid OTP");
  }


  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpiresAt = undefined;

  await user.save();

  return { email: user.email, message: "Email verified successfully" };
};

export const resentEmailOtp = async (email: string) => {

  const user = await User.findOne({ email });

  if (!user) throw new Error("User Not Found");

  const otp = await setUserOtp(user , 10);

  await sendEmail({
    to: email,
    subject: "Verify your email",
    htmlContent: otpEmailTemplate(otp),
  }); 

  return { email: user.email, message: "OTP resent to email" };
};


export const loginUser = async (email: string, password: string): Promise<LoginResult> => {

  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new Error("Invalid Credentials");

  const isMatch = await user.comparePassword(password);

  if (!isMatch) throw new Error("Invalid Password");

  if (!user.isEmailVerified) {

    const otp = await setUserOtp(user , 10);
    
    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      htmlContent: otpEmailTemplate(otp),
    });

    throw new Error("EMAIL_NOT_VERIFIED");

  }

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isKycVerified: user.isKycVerified,
    isEmailVerified: user.isEmailVerified,
  };
};
