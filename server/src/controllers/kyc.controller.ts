import * as KycService from "../services/kyc.service";
import { sendEmail } from "../services/email.service";
import multer from "multer";

export const submitKyc = async (req: any, res: any) => {
  try {
    const files = req.files;
    if (!files || !files.aadhaar || !files.pan || !files.selfie) {
      return res.status(400).json({ message: "All documents required" });
    }

    const documents = {
      aadhaar: { url: files.aadhaar[0].path, publicId: files.aadhaar[0].filename },
      pan: { url: files.pan[0].path, publicId: files.pan[0].filename },
      selfie: { url: files.selfie[0].path, publicId: files.selfie[0].filename },
    };

    const kyc = await KycService.submitKyc(req.user._id, req.body.fullName, documents);

    await sendEmail({
      to: process.env.ADMIN_EMAIL!,
      subject: "New KYC Submitted",
      htmlContent: `<p>User ${req.user.email} submitted KYC.</p>`,});

    res.json({ success: true, message: "KYC submitted successfully", data: kyc, uploadedFiles: documents });
  } catch (err: any) {
    
    if (err instanceof multer.MulterError) {
      
      return res.status(400).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveKyc = async (req: any, res: any) => {
  try {
    const kyc = await KycService.approveKyc(req.params.id, req.user._id);
    await sendEmail({
      to: kyc.userId.email,
      subject: "KYC Approved",
      htmlContent: "Your KYC is approved. You can now buy & sell.",
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectKyc = async (req: any, res: any) => {
  try {
    const kyc = await KycService.rejectKyc(req.params.id, req.user._id, req.body.reason);
    await sendEmail({
      to: kyc.userId.email,
      subject: "KYC Rejected",
      htmlContent: `Reason: ${req.body.reason}`,
    });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getKycs = async (req: any, res: any) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const result = await KycService.getKycs(Number(page), Number(limit), status);
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
