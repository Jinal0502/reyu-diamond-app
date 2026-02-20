import mongoose, { Types } from "mongoose";
import { Rating } from "../models/Rating.model";
import { Deal } from "../models/Deal.model";
import { User } from "../models/User.model";
import { CustomError } from "../utils/customError.utility";
import { updateBadgesForUser } from "./badge.service";

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
    throw new CustomError("Invalid userId", 400);
  }

  const targetUserId = new mongoose.Types.ObjectId(userId);

  // prevent self rating
  if (targetUserId.toString() === raterId.toString()) {
    throw new CustomError("You cannot rate yourself", 400);
  }

  const { dealId, rating, review, categories, isAnonymous } = payload;

  if (!dealId || !mongoose.Types.ObjectId.isValid(dealId)) {
    throw new CustomError("dealId is required and must be valid", 400);
  }

  if (!rating || rating < 1 || rating > 5) {
    throw new CustomError("Rating must be between 1 and 5", 400);
  }

  const deal = await Deal.findById(dealId);

  if (!deal) {
    throw new CustomError("Deal not found", 404);
  }

  // deal must be completed
  if (deal.status !== "COMPLETED") {
    throw new CustomError("You can only rate after deal is COMPLETED", 400);
  }

  // rater must be buyer or seller
  const isAllowed =
    deal.buyerId.toString() === raterId.toString() ||
    deal.sellerId.toString() === raterId.toString();

  if (!isAllowed) {
    throw new CustomError("You are not allowed to rate this deal", 403);
  }

  // target user must be part of deal
  const isCorrectTarget =
    deal.buyerId.toString() === targetUserId.toString() ||
    deal.sellerId.toString() === targetUserId.toString();

  if (!isCorrectTarget) {
    throw new CustomError("This user is not part of this deal", 400);
  }

  // prevent rating duplicate manually (optional, unique index also works)
  const existing = await Rating.findOne({
    dealId: new mongoose.Types.ObjectId(dealId),
    raterId,
  });

  if (existing) {
    throw new CustomError("You already rated this deal", 400);
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
  const stats = await Rating.aggregate([
    { $match: { userId: targetUserId } },
    {
      $group: {
        _id: "$userId",
        avg: { $avg: "$rating" },
        total: { $sum: 1 },
      },
    },
  ]);

  const avgRating = stats.length ? stats[0].avg : 0;
  const totalRatings = stats.length ? stats[0].total : 0;

  await User.findByIdAndUpdate(targetUserId, {
    $set: {
      "stats.averageRating": Number(avgRating.toFixed(2)),
      "stats.totalRatings": totalRatings,
    },
  });

  // update badges
  await updateBadgesForUser(targetUserId);

  return created;
};

export const getRatingsService = async (userId: string | Types.ObjectId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new CustomError("Invalid userId", 400);
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
