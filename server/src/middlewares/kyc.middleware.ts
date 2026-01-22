export const kycVerifiedOnly = (req: any, res: any, next: any) => {
  if (!req.user.isKycVerified) {
    return res.status(403).json({
      message: "KYC approval required",
    });
  }
  next();
};
