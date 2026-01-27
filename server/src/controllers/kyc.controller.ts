import * as KycService from "../services/kyc.service";
import { sendEmail } from "../services/email.service";
import multer from "multer";
import { sendResponse } from "../utils/api.response";

export const submitKyc = async (req: any, res: any, next: any) => {
  try {
    const files = req.files;
    const { aadhaarNo, panNo, fullName } = req.body;

    if (!aadhaarNo || !panNo) {
      return sendResponse(res, 400, false, "Aadhaar & PAN numbers are required");
    }

    if (!files?.aadhaar || !files?.pan || !files?.selfie) {
      return sendResponse(res, 400, false, "All documents are required");
    }

    const documents = {
      aadhaar: {
        url: files.aadhaar[0].path,
        publicId: files.aadhaar[0].filename,
      },
      pan: {
        url: files.pan[0].path,
        publicId: files.pan[0].filename,
      },
      selfie: {
        url: files.selfie[0].path,
        publicId: files.selfie[0].filename,
      },
    };

    const kyc = await KycService.submitKyc(
      req.user._id,
      fullName,
      aadhaarNo,
      panNo,
      documents
    );

    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: "New KYC Submitted",
      htmlContent: `<p>User ${req.user.email} submitted KYC.</p>`,
    });

    return sendResponse(res, 200, true, "KYC submitted successfully");
  } catch (err) {
    if (err instanceof multer.MulterError) {
      return sendResponse(res, 400, false, err.message);
    }
    next(err);
  }
};
export const verifyKyc = async (req: any, res: any, next: any) => {
  try {
    const { decision, reason } = req.body;

    if (!["approved", "rejected"].includes(decision)) {
      return sendResponse(res, 400, false, "Invalid decision");
    }

    const kyc = await KycService.verifyKyc(
      req.params.id,
      req.user._id,
      decision,
      reason
    );

    await sendEmail({
      to: kyc.userId.email,
      subject: decision === "approved" ? "KYC Approved" : "KYC Rejected",
      htmlContent:
        decision === "approved"
          ? "Your KYC is approved. You can now buy & sell."
          : `Your KYC was rejected. Reason: ${reason}`,
    });

    return sendResponse(res, 200, true, `KYC ${decision}`);
  } catch (err) {
    next(err);
  }
};

export const getKycs = async (req: any, res: any, next: any) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const result = await KycService.getKycs(
      Number(page),
      Number(limit),
      status
    );

    return sendResponse(res, 200, true, "KYC list retrieved", result);
  } catch (err) {
    next(err);
  }
};


