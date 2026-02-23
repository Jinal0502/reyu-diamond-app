import { Types } from "mongoose";
import mongoose from "mongoose";
import { User } from "../models/User.model";
import { updateBadgesForUser } from "./badge.service";
import { Rating } from "../models/Rating.model";

interface IUserStats {
  averageRating: number;
  totalRatings: number;
  reputationScore: number;
  badgeCount: number;
  completedDeals: number;
  cancelDeals: number;
  totalVolume: number;
  totalShipments: number;
}

interface CancelPayload {
  cancelledBy: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
}


const calculateReputation = (stats: IUserStats): number => {
  return (
    stats.completedDeals * 5 +
    stats.averageRating * 20 +
    stats.totalShipments * 2 -
    stats.cancelDeals * 3
  );
};

export const handleSellerDealCompleted = async (
  sellerId: Types.ObjectId,
  dealAmount: number
) => {
  const user = await User.findById(sellerId);
  if (!user) return;

  user.stats.completedDeals += 1;
  user.stats.totalVolume += dealAmount;
  user.stats.totalShipments += 1;

  user.stats.reputationScore = calculateReputation(user.stats);

  await user.save();
  await updateBadgesForUser(user._id);
};

export const handleBuyerDealCompleted = async (
  buyerId: Types.ObjectId
) => {
  const user = await User.findById(buyerId);
  if (!user) return;

  user.stats.completedDeals += 1;

  user.stats.reputationScore = calculateReputation(user.stats);

  await user.save();
  await updateBadgesForUser(user._id);
};

export const handleDealCancelled = async (
  cancelPayload: CancelPayload
) => {
  const { cancelledBy } = cancelPayload;

  const user = await User.findById(cancelledBy);
  if (!user) return;

  user.stats.cancelDeals += 1;

  user.stats.reputationScore = calculateReputation(user.stats);

  await user.save();
  await updateBadgesForUser(user._id);
};

export const handleRatingSubmitted = async (
  userId: mongoose.Types.ObjectId
) => {
  const stats = await Rating.aggregate([
    { $match: { userId } },
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

  const user = await User.findById(userId);
  if (!user) return;

  user.stats.averageRating = Number(avgRating.toFixed(2));
  user.stats.totalRatings = totalRatings;

  user.stats.reputationScore = calculateReputation(user.stats);

  await user.save();
  await updateBadgesForUser(userId);
};