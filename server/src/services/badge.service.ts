import { Types } from "mongoose";
import { Badge } from "../models/Badge.model";
import { UserBadge } from "../models/UserBadge.model";
import { Deal } from "../models/Deal.model";
import { User } from "../models/User.model";
import logger from "../utils/logger";
import * as NotificationEvents from "../notifications/events";

// Example badge rules
// You can add more later in DB
const badgeCriteriaCheck = async (userId: Types.ObjectId, criteria: any) => {
  const user = await User.findById(userId).select("stats");
  if (!user || !user.stats) return { isEarned: false, current: 0 };

  const stats = user.stats;
  let current = 0;
  let target = criteria.target || 1;
  let isEarned = false;

  if (criteria.completedDeals) {
    current = stats.completedDeals || 0;
    target = criteria.completedDeals;
    isEarned = current >= target;
  } else if (criteria.totalVolume) {
    current = stats.totalVolume || 0;
    target = criteria.totalVolume;
    isEarned = current >= target;
  } else if (criteria.averageRating) {
    current = stats.averageRating || 0;
    target = criteria.averageRating;
    isEarned = current >= target;
  }

  return { isEarned, current, target };
};

export const updateBadgesForUser = async (userId: Types.ObjectId) => {
  const badges = await Badge.find({ isActive: true });

  let earnedCount = 0;

  for (const badge of badges) {
    const already = await UserBadge.findOne({ userId, badgeId: badge.badgeId });

    const { isEarned, current, target } = await badgeCriteriaCheck(userId, badge.criteria);
    const percentage = Math.min(100, Math.floor((current / target) * 100));

    if (!already) {
      await UserBadge.create({
        userId,
        badgeId: badge.badgeId,
        progress: {
          current,
          target,
          percentage,
        },
        isEarned,
        earnedAt: isEarned ? new Date() : null,
      });

      if (isEarned) {
        logger.info("Badge earned by user", { userId, badgeId: badge.badgeId, badgeName: badge.name });
        // 🔥 Notification
        NotificationEvents.notifyBadgeEarned(userId.toString(), badge.name);
      }
    } else {
      await UserBadge.updateOne(
        { _id: already._id },
        {
          $set: {
            isEarned,
            earnedAt: isEarned ? already.earnedAt || new Date() : null,
            "progress.current": current,
            "progress.target": target,
            "progress.percentage": percentage,
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
