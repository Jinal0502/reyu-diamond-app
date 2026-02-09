import mongoose, { Types } from "mongoose";
import { KYC } from "../models/Kyc.model";
import { User } from "../models/User.model";
import { deleteFolderByPrefix } from "../utils/cloundinary.delete";
import crypto from "crypto";
import { CustomError } from "../utils/customError.utility";

interface IUserPopulated {
  _id: Types.ObjectId;
  email: string;
  name?: string;
}

const hashValue = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

/* ================= SUBMIT KYC ================= */

export const submitKyc = async (
  userId: string,
  data: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dob: string;
    phone: string;

    address: {
      residentialAddress: string;
      city: string;
      state: string;
      pincode: string;
      country?: string;
    };

    aadhaarNo: string;
    panNo: string;

    documents: {
      aadhaar: { url: string; publicId: string };
      pan: { url: string; publicId: string };
      selfie?: { url: string; publicId: string };
    };
  }
) => {
  const userObjectId = new mongoose.Types.ObjectId(userId);

  const existing = await KYC.findOne({ userId: userObjectId });

  if (existing?.status === "approved") {
    throw new CustomError("KYC already approved", 400);
  }

  // delete old files
  if (existing) {
    await deleteFolderByPrefix(`kyc/${userId}`);
  }

  const updatePayload: any = {
    firstName: data.firstName,
    middleName: data.middleName,
    lastName: data.lastName,

    dob: new Date(data.dob),
    phone: data.phone,

    address: {
      residentialAddress: data.address.residentialAddress,
      city: data.address.city,
      state: data.address.state,
      pincode: data.address.pincode,
      country: data.address.country,
    },

    documents: {
      aadhaar: {
        aadhaarHash: hashValue(data.aadhaarNo),
        aadhaarLast4: data.aadhaarNo.slice(-4),
        ...data.documents.aadhaar,
      },
      pan: {
        panHash: hashValue(data.panNo),
        panLast4: data.panNo.slice(-4).toUpperCase(),
        ...data.documents.pan,
      },
      selfie: data.documents.selfie ? { ...data.documents.selfie } : undefined,
    },

    status: "pending",
    rejectionReason: undefined,
    verifiedBy: undefined,
    verifiedAt: undefined,
  };

  return KYC.findOneAndUpdate({ userId: userObjectId }, updatePayload, {
    upsert: true,
    new: true,
  });
};

/* ================= VERIFY KYC ================= */

type KycDecision = "approved" | "rejected";

export const verifyKyc = async (
  kycId: string,
  adminId: string,
  decision: KycDecision,
  reason?: string
) => {
  if (decision === "rejected" && !reason) {
    throw new CustomError("Rejection reason is required", 400);
  }

  const kyc = await KYC.findById(kycId).populate<{ userId: IUserPopulated }>(
    "userId"
  );

  if (!kyc) throw new CustomError("KYC not found", 404);

  if (kyc.status === "approved") {
    throw new CustomError("KYC already approved", 400);
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

/* ================= GET KYCS ================= */

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
