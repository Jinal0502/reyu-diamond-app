import crypto from "crypto";

export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

export const setUserOtp = async (user: any , expiryMinutes = 10): Promise<string> => {
  const otp = generateOTP();

  user.otp = otp;
  user.otpExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  await user.save();
  
  return otp;
};