import mongoose, { Types } from "mongoose";
import { KYC } from "../models/Kyc.model";
import { User } from "../models/User.model";
import { deleteSingleFile, CustomError, HTTP_STATUS, ErrorCode } from "../utils";
import crypto from "crypto";
import logger from "../utils/logger";
import * as NotificationEvents from "../notifications/events";

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
    throw new CustomError("KYC already approved", HTTP_STATUS.BAD_REQUEST, ErrorCode.KYC_ALREADY_APPROVED);
  }

  const oldPublicIds = {
    aadhaar: existing?.documents?.aadhaar?.publicId,
    pan: existing?.documents?.pan?.publicId,
    selfie: existing?.documents?.selfie?.publicId,
  };

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

  const updatedKyc = await KYC.findOneAndUpdate(
    { userId: userObjectId },
    { $set: updatePayload },
    { upsert: true, new: true }
  );

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

    await Promise.all(deletePromises);
  }

  logger.info("KYC submitted", { userId });

  // 🔥 Notification for Admins
  NotificationEvents.notifyKycSubmitted(data.firstName + " " + data.lastName, userId);

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
    throw new CustomError("Rejection reason is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  const kyc = await KYC.findById(kycId).populate<{ userId: IUserPopulated }>("userId");

  if (!kyc) throw new CustomError("KYC not found", HTTP_STATUS.NOT_FOUND, ErrorCode.KYC_NOT_FOUND);

  if (kyc.status === "approved") {
    throw new CustomError("KYC already approved", HTTP_STATUS.BAD_REQUEST, ErrorCode.KYC_ALREADY_APPROVED);
  }

  kyc.status = decision;
  kyc.verifiedBy = new mongoose.Types.ObjectId(adminId);
  kyc.verifiedAt = new Date();
  kyc.rejectionReason = decision === "rejected" ? reason : undefined;

  await kyc.save();

  await User.findByIdAndUpdate(kyc.userId._id, {
    isKycVerified: decision === "approved",
  });

  logger.info("KYC decision made", { kycId, decision, adminId });

  // 🔥 Notification
  NotificationEvents.notifyKycStatus(kyc.userId._id.toString(), decision.toUpperCase() as any, reason);

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
