import mongoose, { Types } from "mongoose";
import { Rating } from "../models/Rating.model";
import { Deal } from "../models/Deal.model";
import { User } from "../models/User.model";
import { CustomError, HTTP_STATUS, ErrorCode } from "../utils";
import { updateBadgesForUser } from "./badge.service";
import { handleRatingSubmitted} from "./user-stats.service";
import logger from "../utils/logger";

interface CreateRatingInput {
  userId: string | Types.ObjectId;
  raterId: Types.ObjectId;
  payload: any;
}

export const createRatingService = async ({
  userId,
  raterId,
  payload,
}: CreateRatingInput) => {
  // validate userId
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new CustomError("Invalid userId", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  const targetUserId = new mongoose.Types.ObjectId(userId);

  // prevent self rating
  if (targetUserId.toString() === raterId.toString()) {
    throw new CustomError("You cannot rate yourself", HTTP_STATUS.BAD_REQUEST, ErrorCode.SELF_RATING_NOT_ALLOWED);
  }

  const { dealId, rating, review, categories, isAnonymous } = payload;

  if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
    throw new CustomError("dealId is required and must be valid", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new CustomError("Rating must be between 1 and 5", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  const deal = await Deal.findById(dealId);

  if (!deal) {
    throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  // deal must be completed
  if (deal.status !== "COMPLETED") {
    throw new CustomError("You can only rate after deal is COMPLETED", HTTP_STATUS.BAD_REQUEST, ErrorCode.DEAL_NOT_COMPLETED);
  }

  // rater must be buyer or seller
  const isAllowed =
    deal.buyerId.toString() === raterId.toString() ||
    deal.sellerId.toString() === raterId.toString();

  if (!isAllowed) {
    throw new CustomError("You are not allowed to rate this deal", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
  }

  // target user must be part of deal
  const isCorrectTarget =
    deal.buyerId.toString() === targetUserId.toString() ||
    deal.sellerId.toString() === targetUserId.toString();

  if (!isCorrectTarget) {
    throw new CustomError("This user is not part of this deal", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  // prevent rating duplicate manually (optional, unique index also works)
  const existing = await Rating.findOne({
    dealId: new mongoose.Types.ObjectId(dealId),
    raterId,
  });

  if (existing) {
    throw new CustomError("You already rated this deal", HTTP_STATUS.CONFLICT, ErrorCode.RATING_ALREADY_EXISTS);
  }

  // create rating
  const created = await Rating.create({
    userId: targetUserId,
    raterId,
    dealId,
    rating,
    review,
    categories,
    isAnonymous: isAnonymous || false,
  });

  // update user rating stats
  await handleRatingSubmitted(targetUserId);
  logger.info("Rating submitted", { ratingId: created._id, targetUserId, raterId, dealId, rating });
  return created;
};

export const getRatingsService = async (userId: string | Types.ObjectId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new CustomError("Invalid userId", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  const targetUserId = new mongoose.Types.ObjectId(userId);

  const ratings = await Rating.find({ userId: targetUserId })
    .populate("raterId", "name email")
    .sort({ createdAt: -1 });

  const user = await User.findById(targetUserId).select("stats name email");

  return {
    user,
    ratings,
  };
};
