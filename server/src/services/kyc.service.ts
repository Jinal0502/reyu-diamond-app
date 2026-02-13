import mongoose, { Types } from "mongoose";
import { KYC } from "../models/Kyc.model";
import { User } from "../models/User.model";
import { deleteSingleFile } from "../utils/cloundinary.delete";
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

  // 1. Fetch existing KYC
  const existing = await KYC.findOne({ userId: userObjectId });

  if (existing?.status === "approved") {
    throw new CustomError("KYC already approved", 400);
  }

  // 2. Store old publicIds (for deletion later)
  const oldPublicIds = {
    aadhaar: existing?.documents?.aadhaar?.publicId,
    pan: existing?.documents?.pan?.publicId,
    selfie: existing?.documents?.selfie?.publicId,
  };

  // 3. Prepare update payload (new docs already uploaded)
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
      country: data.address.country || "India",
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

  // 4. Update Mongo first (VERY IMPORTANT)
  const updatedKyc = await KYC.findOneAndUpdate(
    { userId: userObjectId },
    { $set: updatePayload },
    { upsert: true, new: true }
  );

  // 5. Delete old files AFTER successful DB update
  //    (so if upload fails, old docs are still safe)
  if (existing) {
    const deletePromises: Promise<void>[] = [];

    if (oldPublicIds.aadhaar && oldPublicIds.aadhaar !== data.documents.aadhaar.publicId) {
      deletePromises.push(deleteSingleFile(oldPublicIds.aadhaar));
    }

    if (oldPublicIds.pan && oldPublicIds.pan !== data.documents.pan.publicId) {
      deletePromises.push(deleteSingleFile(oldPublicIds.pan));
    }

    if (
      oldPublicIds.selfie &&
      data.documents.selfie?.publicId &&
      oldPublicIds.selfie !== data.documents.selfie.publicId
    ) {
      deletePromises.push(deleteSingleFile(oldPublicIds.selfie));
    }

    // delete all in parallel
    await Promise.all(deletePromises);
  }

  return updatedKyc;
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
