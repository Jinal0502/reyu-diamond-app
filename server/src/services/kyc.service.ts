import mongoose, { Types } from "mongoose";
import { KYC } from "../models/Kyc.model";
import { User } from "../models/User.model";
import  {deleteKycFiles} from "../utils/cloundinary.delete"

interface IUserPopulated {
  _id: Types.ObjectId;
  email: string;
  name?: string;
}

export const submitKyc = async (
  userId: string,
  fullName: string,
  documents: { aadhaar: { url: string; publicId: string }; pan: { url: string; publicId: string }; selfie: { url: string; publicId: string } }
) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const existing = await KYC.findOne({ userId: userObjectId });

  if (existing?.status === "approved") throw new Error("KYC already approved");

  
  if (existing) await deleteKycFiles(userId);

  return KYC.findOneAndUpdate(
    { userId: userObjectId },
    {
      name: fullName,
      documents,
      status: "pending",
      rejectionReason: undefined,
      verifiedBy: undefined,
      verifiedAt: undefined,
    },
    { upsert: true, new: true }
  );
};

export const approveKyc = async (kycId: string, adminId: string) => {
  const kyc = await KYC.findById(kycId).populate<{ userId: IUserPopulated }>("userId");
  if (!kyc) throw new Error("KYC not found");

  kyc.status = "approved";
  kyc.verifiedBy = new mongoose.Types.ObjectId(adminId);
  kyc.verifiedAt = new Date();
  kyc.rejectionReason = undefined;

  await kyc.save();
  await User.findByIdAndUpdate(kyc.userId._id, { isKycVerified: true });

  return kyc;
};

export const rejectKyc = async (kycId: string, adminId: string, reason: string) => {
  if (!reason) throw new Error("Reason required");

  const kyc = await KYC.findById(kycId).populate<{ userId: IUserPopulated }>("userId");
  if (!kyc) throw new Error("KYC not found");

  kyc.status = "rejected";
  kyc.rejectionReason = reason;
  kyc.verifiedBy = new mongoose.Types.ObjectId(adminId);
  kyc.verifiedAt = new Date();

  await kyc.save();
  await User.findByIdAndUpdate(kyc.userId._id, { isKycVerified: false });

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
