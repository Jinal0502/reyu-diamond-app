import { sendResponse } from "../utils/api.response"

export const kycVerifiedOnly = (req: any, res: any, next: any) => {
  if (!req.user.isKycVerified) {
    return sendResponse(res, 403, false, "KYC approval required");
  }
  next();
};
