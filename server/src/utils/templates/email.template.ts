export const otpEmailTemplate = (otp: string) => `
  <div style="font-family: Arial, sans-serif; color: #333333; line-height: 1.5;">
    <h2>Email Verification</h2>
    <p>We received a request to verify your email address.</p>
    <p>Your OTP for email verification is:</p>
    <h1 style="color: #007bff;">${otp}</h1>
    <p>This OTP is valid for <strong>10 minutes</strong>.</p>
    <p>If you did not request this, please ignore this email.</p>
    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
    <p style="font-size: 12px; color: #888888;">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
`;

export const passwordResetOtpTemplate = (otp: string) => `
  <div style="font-family: Arial, sans-serif;">
    <h2>Password Reset Request</h2>
    <p>We received a request to reset your password.</p>
    <p>Your OTP for password reset is:</p>
    <h1 style="color: #d9534f;">${otp}</h1>
    <p>This OTP is valid for 10 minutes.</p>
    <p>If you did not request a password reset, please ignore this email or contact support immediately.</p>
    <hr />
    <p style="font-size: 12px; color: #888;">
      This is an automated message. Please do not reply to this email.
    </p>
  </div>
`;

