export const otpEmailTemplate = (otp: string) => `
  <div style="font-family: Arial, sans-serif;">
    <h2>Email Verification</h2>
    <p>Your OTP for email verification is:</p>
    <h1>${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  </div>
`;
