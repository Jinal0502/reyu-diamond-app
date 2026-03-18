import * as KycService from "../services/kyc.service";
import { sendEmail } from "../services/email.service";
import multer from "multer";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";
import logger from "../utils/logger";

export const submitKyc = async (req: any, res: any, next: any) => {
  try {
    const files = req.files;
    const {
      firstName, middleName, lastName, dob, phone,
      residentialAddress, city, state, pincode, country,
      aadhaarNo, panNo,
    } = req.body;

    const documents: {
      aadhaar: { url: string; publicId: string };
      pan: { url: string; publicId: string };
      selfie?: { url: string; publicId: string };
    } = {
      aadhaar: { url: files.aadhaar[0].path, publicId: files.aadhaar[0].filename },
      pan: { url: files.pan[0].path, publicId: files.pan[0].filename },
    };

    if (files?.selfie?.length > 0) {
      documents.selfie = { url: files.selfie[0].path, publicId: files.selfie[0].filename };
    }

    const kyc = await KycService.submitKyc(req.user._id, {
      firstName, middleName, lastName, dob, phone,
      address: { residentialAddress, city, state, pincode, country },
      aadhaarNo, panNo, documents,
    });

    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: "New KYC Submitted",
      htmlContent: `<p>User ${req.user.email} submitted KYC.</p>`,
    });

    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.KYC_SUBMITTED], kyc, undefined, SuccessCode.KYC_SUBMITTED);
  } catch (err) {
    if (err instanceof multer.MulterError) {
      logger.warn("KYC upload multer error", { userId: req.user?._id, error: err.message });
      return sendResponse(res, 400, false, err.message, null);
    }
    next(err);
  }
};

export const verifyKyc = async (req: any, res: any, next: any) => {
  try {
    const { decision, reason } = req.body;
    const kyc = await KycService.verifyKyc(req.params.id, req.user._id, decision, reason);

    await sendEmail({
      to: kyc.userId.email,
      subject: decision === "approved" ? "KYC Approved" : "KYC Rejected",
      htmlContent:
        decision === "approved"
          ? "Your KYC is approved. You can now buy & sell."
          : `Your KYC was rejected. Reason: ${reason}`,
    });

    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.KYC_VERIFIED], kyc, undefined, SuccessCode.KYC_VERIFIED);
  } catch (err) {
    next(err);
  }
};

export const getKycs = async (req: any, res: any, next: any) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const result = await KycService.getKycs(Number(page), Number(limit), status);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.KYC_LIST_FETCHED], result, undefined, SuccessCode.KYC_LIST_FETCHED);
  } catch (err) {
    next(err);
  }
};
