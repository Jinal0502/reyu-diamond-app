import { Types } from "mongoose";
import { Advertisement } from "../models/Advertisement.model";
import { CustomError } from "../utils/customError.utility";

  //  REQUEST AD

interface RequestAdInput {
  advertiserId: Types.ObjectId;
  payload: any;
}

export const requestAdService = async ({
  advertiserId,
  payload,
}: RequestAdInput) => {
  const {
    title,
    description,
    mediaUrl,
    mediaType,
    ctaLink,
    bannerSection,
    startDate,
    endDate,
  } = payload;

  if (!title || !mediaUrl || !mediaType) {
    throw new CustomError("Required fields missing", 400);
  }

  const ad = await Advertisement.create({
    advertiserId,
    title,
    description,
    mediaUrl,
    mediaType,
    ctaLink,
    bannerSection,
    startDate,
    endDate,
    status: "PENDING",
  });

  return ad;
};

  //  GET USER ADS

export const getUserAdsService = async (advertiserId: Types.ObjectId) => {
  return Advertisement.find({ advertiserId }).sort({ createdAt: -1 });
};

  //  GET ACTIVE ADS (FOR SERVING)

export const getActiveAdsService = async (section?: string) => {
  const now = new Date();

  const filter: any = {
    status: "APPROVED",
    $and: [
      {
        $or: [{ startDate: null }, { startDate: { $lte: now } }],
      },
      {
        $or: [{ endDate: null }, { endDate: { $gte: now } }],
      },
    ],
  };

  if (section) {
    filter.bannerSection = section;
  }

  const ads = await Advertisement.find(filter).sort({
    createdAt: -1,
  });

  return ads;
};

  //  GET AD BY ID

export const getAdByIdService = async (adId: Types.ObjectId) => {
  const ad = await Advertisement.findById(adId);

  if (!ad) throw new CustomError("Advertisement not found", 404);

  return ad;
};

  //  ADMIN UPDATE STATUS

interface UpdateStatusInput {
  adId: Types.ObjectId;
  adminId: Types.ObjectId;
  payload: any;
}

export const updateAdStatusService = async ({
  adId,
  adminId,
  payload,
}: UpdateStatusInput) => {
  const { action, rejectionReason } = payload;

  const ad = await Advertisement.findById(adId);

  if (!ad) throw new CustomError("Advertisement not found", 404);

  if (!["APPROVE", "REJECT", "DISABLE"].includes(action)) {
    throw new CustomError("Invalid action", 400);
  }

  if (action === "APPROVE") {
    ad.status = "APPROVED";
    ad.rejectionReason = undefined;
  }

  if (action === "REJECT") {
    if (!rejectionReason)
      throw new CustomError("rejectionReason required", 400);

    ad.status = "REJECTED";
    ad.rejectionReason = rejectionReason;
  }

  if (action === "DISABLE") {
    ad.status = "DISABLED";
  }

  await ad.save();

  return ad;
};

   //CLICK AD (SECURE REDIRECT)

interface ClickAdInput {
  adId: Types.ObjectId;
  currentUserId?: Types.ObjectId;
}

export const clickAdService = async ({
  adId,
  currentUserId,
}: ClickAdInput) => {
  const ad = await Advertisement.findById(adId);

  if (!ad) throw new CustomError("Advertisement not found", 404);

  /* ---------- STATUS CHECK ---------- */
  if (ad.status !== "APPROVED") {
    throw new CustomError("Ad not active", 400);
  }

  const now = new Date();

  /* ---------- DATE CHECK ---------- */
  if (ad.startDate && ad.startDate > now) {
    throw new CustomError("Campaign not started", 400);
  }

  if (ad.endDate && ad.endDate < now) {
    throw new CustomError("Campaign expired", 400);
  }

  /* ---------- CTA CHECK ---------- */
  if (!ad.ctaLink) {
    throw new CustomError("Redirect link missing", 400);
  }

  return ad.ctaLink;
};