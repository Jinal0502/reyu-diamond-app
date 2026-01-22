import { User } from "../models/User.model";
import crypto from "crypto";
import { sendEmail } from "../services/email.service";
import { otpEmailTemplate } from "../utils/email.template";

interface LoginResult {
  _id: string;
  name: string;
  email: string;
  role: string;
  isKycVerified: boolean;
}

const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};


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


  const otp = generateOTP();
  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);


  await user.save();

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

export const loginUser = async (email: string, password: string): Promise<LoginResult> => {

  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new Error("Invalid Credentials");

  const isMatch = await user.comparePassword(password);

  if (!isMatch) throw new Error("Invalid Password");

  return {
    _id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isKycVerified: user.isKycVerified,
  };
};


