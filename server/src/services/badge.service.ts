import { Types } from "mongoose";
import { Badge } from "../models/Badge.model";
import { UserBadge } from "../models/UserBadge.model";
import { Deal } from "../models/Deal.model";
import { User } from "../models/User.model";
import logger from "../utils/logger";

// Example badge rules
// You can add more later in DB
const badgeCriteriaCheck = async (userId: Types.ObjectId, criteria: any) => {
  const stats = await User.findById(userId).select("stats");
  if (!stats) return false;

  // example supported criteria:
  // { completedDeals: 10 }
  // { totalVolume: 1000000 }

  if (criteria.completedDeals) {
    return stats.stats.completedDeals >= criteria.completedDeals;
  }

  if (criteria.totalVolume) {
    return stats.stats.totalVolume >= criteria.totalVolume;
  }

  if (criteria.averageRating) {
    return stats.stats.averageRating >= criteria.averageRating;
  }

  return false;
};

export const updateBadgesForUser = async (userId: Types.ObjectId) => {
  const badges = await Badge.find({ isActive: true });

  let earnedCount = 0;

  for (const badge of badges) {
    const already = await UserBadge.findOne({ userId, badgeId: badge.badgeId });

    const target = badge.criteria?.target || 1;
    const current = 0;

    const isEarned = await badgeCriteriaCheck(userId, badge.criteria);

    if (!already) {
      await UserBadge.create({
        userId,
        badgeId: badge.badgeId,
        progress: {
          current,
          target,
          percentage: isEarned ? 100 : 0,
        },
        isEarned,
        earnedAt: isEarned ? new Date() : null,
      });

      if (isEarned) {
        logger.info("Badge earned by user", { userId, badgeId: badge.badgeId, badgeName: badge.name });
      }
    } else {
      await UserBadge.updateOne(
        { _id: already._id },
        {
          $set: {
            isEarned,
            earnedAt: isEarned ? already.earnedAt || new Date() : null,
            "progress.target": target,
            "progress.percentage": isEarned ? 100 : already.progress.percentage,
          },
        }
      );
    }

    if (isEarned) earnedCount++;
  }

  await User.findByIdAndUpdate(userId, {
    $set: { "stats.badgeCount": earnedCount },
  });

  return earnedCount;
};

export const getUserBadgesService = async (userId: Types.ObjectId) => {
  const userBadges = await UserBadge.find({ userId }).sort({ createdAt: -1 });
  const badgeMaster = await Badge.find({ isActive: true });

  const userBadgeMap = new Map(
    userBadges.map((b) => [b.badgeId, b])
  );

  const merged = badgeMaster.map((badge) => {
    const userBadge = userBadgeMap.get(badge.badgeId);
    return {
      badgeId: badge.badgeId,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      tier: badge.tier,

      isEarned: userBadge ? userBadge.isEarned : false,
      earnedAt: userBadge ? userBadge.earnedAt : null,

      progress: userBadge ? userBadge.progress : { current: 0, target: badge.criteria?.target || 1, percentage: 0 },
    };
  });

  return merged;
};
