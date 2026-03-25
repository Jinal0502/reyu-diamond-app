import { sendResponse } from "../utils";
import { ErrorCode } from "../utils";

export const kycVerifiedOnly = (req: any, res: any, next: any) => {
  if (!req.user.isKycVerified) {
    return sendResponse(res, 403, false, "KYC approval required", null, ErrorCode.KYC_REQUIRED);
  }
  next();
};
