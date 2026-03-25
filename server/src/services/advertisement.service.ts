import { Types } from "mongoose";
import { Advertisement } from "../models/Advertisement.model";
import { CustomError, HTTP_STATUS, ErrorCode } from "../utils";
import logger from "../utils/logger";
import * as NotificationEvents from "../notifications/events";

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
    throw new CustomError("Required fields missing", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  const ad = await Advertisement.create({
    advertiserId,
    title,
    description,
    mediaUrl,
    mediaType,
    ctaLink,
    bannerSection: Array.isArray(bannerSection) ? bannerSection : (bannerSection ? [bannerSection] : ["BANNER_ZONES"]),
    startDate,
    endDate,
    status: "PENDING",
  });

  logger.info("Advertisement request created", { adId: ad._id, advertiserId });
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
    filter.bannerSection = { $in: [section] };
  }

  const ads = await Advertisement.find(filter).sort({
    createdAt: -1,
  });

  return ads;
};

  //  GET AD BY ID

export const getAdByIdService = async (adId: Types.ObjectId) => {
  const ad = await Advertisement.findById(adId);

  if (!ad) throw new CustomError("Advertisement not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

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

  if (!ad) throw new CustomError("Advertisement not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  if (!["APPROVE", "REJECT", "DISABLE"].includes(action)) {
    throw new CustomError("Invalid action", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  if (action === "APPROVE") {
    ad.status = "APPROVED";
    ad.rejectionReason = undefined;
  }

  if (action === "REJECT") {
    if (!rejectionReason)
      throw new CustomError("rejectionReason required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);

    ad.status = "REJECTED";
    ad.rejectionReason = rejectionReason;
  }

  if (action === "DISABLE") {
    ad.status = "DISABLED";
  }

  await ad.save();

  // 🔥 Notification
  NotificationEvents.notifyAdStatusUpdate(ad.advertiserId.toString(), ad.title, ad.status);

  logger.info("Advertisement status updated", { adId, action, adminId });
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

  if (!ad) throw new CustomError("Advertisement not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  /* ---------- STATUS CHECK ---------- */
  if (ad.status !== "APPROVED") {
    throw new CustomError("Ad not active", HTTP_STATUS.BAD_REQUEST, ErrorCode.AD_NOT_ACTIVE);
  }

  const now = new Date();

  /* ---------- DATE CHECK ---------- */
  if (ad.startDate && ad.startDate > now) {
    throw new CustomError("Campaign not started", HTTP_STATUS.BAD_REQUEST, ErrorCode.AD_CAMPAIGN_NOT_STARTED);
  }

  if (ad.endDate && ad.endDate < now) {
    throw new CustomError("Campaign expired", HTTP_STATUS.BAD_REQUEST, ErrorCode.AD_CAMPAIGN_EXPIRED);
  }

  /* ---------- CTA CHECK ---------- */
  if (!ad.ctaLink) {
    throw new CustomError("Redirect link missing", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  // Increment click count
  await Advertisement.findByIdAndUpdate(adId, { $inc: { clicks: 1 } });

  logger.info("Ad click redirect", { adId, currentUserId });
  return ad.ctaLink;
};