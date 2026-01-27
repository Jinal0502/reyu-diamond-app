import mongoose, { Types } from "mongoose";
import { KYC } from "../models/Kyc.model";
import { User } from "../models/User.model";
import  {deleteKycFiles} from "../utils/cloundinary.delete";
import crypto from "crypto";

interface IUserPopulated {
  _id: Types.ObjectId;
  email: string;
  name?: string;
}

const hashValue = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

export const submitKyc = async (
  userId: string,
  name: string,
  aadhaarNo: string,
  panNo: string,
  documents: {
    aadhaar: { url: string; publicId: string };
    pan: { url: string; publicId: string };
    selfie: { url: string; publicId: string };
  }
) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const existing = await KYC.findOne({ userId: userObjectId });

  if (existing?.status === "approved") {
    throw new Error("KYC already approved");
  }

  if (existing) {
    await deleteKycFiles(userId);
  }

  return KYC.findOneAndUpdate(
    { userId: userObjectId },
    {
      name,
      documents: {
        aadhaar: {
          aadhaarHash: hashValue(aadhaarNo),
          aadhaarLast4: aadhaarNo.slice(-4),
          ...documents.aadhaar,
        },
        pan: {
          panHash: hashValue(panNo),
          panLast4: panNo.slice(-4),
          ...documents.pan,
        },
        selfie: documents.selfie,
      },
      status: "pending",
      rejectionReason: undefined,
      verifiedBy: undefined,
      verifiedAt: undefined,
    },
    { upsert: true, new: true }
  );
};
type KycDecision = "approved" | "rejected";

export const verifyKyc = async (
  kycId: string,
  adminId: string,
  decision: KycDecision,
  reason?: string
) => {
  if (decision === "rejected" && !reason) {
    throw new Error("Rejection reason is required");
  }

  const kyc = await KYC.findById(kycId)
    .populate<{ userId: IUserPopulated }>("userId");

  if (!kyc) throw new Error("KYC not found");

  if (kyc.status === "approved") {
  throw new Error("KYC already approved");
}

  kyc.status = decision;
  kyc.verifiedBy = new mongoose.Types.ObjectId(adminId);
  kyc.verifiedAt = new Date();
  kyc.rejectionReason = decision === "rejected" ? reason : undefined;

  await kyc.save();

  await User.findByIdAndUpdate(kyc.userId._id, {
    isKycVerified: decision === "approved",
  });

  return kyc;
};

export const getKycs = async (page = 1, limit = 10, status?: string) => {
  const query: any = status ? { status } : {};
  const skip = (page - 1) * limit;

  const data = await KYC.find(query)
    .populate("userId", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await KYC.countDocuments(query);

  return { data, total };
};
