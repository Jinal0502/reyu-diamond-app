import mongoose from "mongoose";
import { User } from "../models/User.model";
import { KYC } from "../models/Kyc.model";
import { Advertisement } from "../models/Advertisement.model";
import { Deal } from "../models/Deal.model";
import { Auction } from "../models/Auction.model";
import { Inventory } from "../models/Inventory.model";
import { CustomError, HTTP_STATUS, ErrorCode } from "../utils";

export const getAllUsersService = async (page: number = 1, limit: number = 20) => {
  const skip = (page - 1) * limit;
  const users = await User.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .select("-password");

  const total = await User.countDocuments();

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const updateUserStatusService = async (userId: string, isBlocked: boolean) => {
  const user = await User.findByIdAndUpdate(userId, { isBlocked }, { new: true }).select("-password");
  if (!user) throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  return user;
};

export const getAdminDashboardStatsService = async () => {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    // Basic counts
    totalUsers,
    usersByRole,
    kycStats,
    adStats,
    dealStats,
    totalVolumeResult,
    auctionStats,
    inventoryStats,

    // Recent data
    recentUsers,
    recentDeals,

    // Trends (last 7 days)
    userGrowth,
    dealGrowth
  ] = await Promise.all([

    // 1. Total Users
    User.countDocuments(),

    // 2. Users grouped by role
    User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]),

    // 3. KYC breakdown
    KYC.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    // 4. Advertisement stats
    Advertisement.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    // 5. Deal stats by status
    Deal.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    // 6. Total completed deal volume
    Deal.aggregate([
      { $match: { status: "COMPLETED" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$dealAmount" },
          avg: { $avg: "$dealAmount" },
          max: { $max: "$dealAmount" },
          min: { $min: "$dealAmount" }
        }
      }
    ]),

    // 7. Auction stats
    Auction.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    // 8. Inventory stats by status
    Inventory.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]),

    // 9. Recent users (last 5)
    User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt"),

    // 10. Recent deals
    Deal.find().sort({ createdAt: -1 }).limit(5).select("dealAmount status createdAt"),

    // 11. User growth (last 7 days)
    User.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]),

    // 12. Deal growth (last 7 days)
    Deal.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$dealAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
  ]);

  const totalDeals = dealStats.reduce((acc, curr) => acc + curr.count, 0);

  return {
    overview: {
      totalUsers,
      totalDeals,
      totalVolume: totalVolumeResult[0]?.total || 0,
      averageDealSize: totalVolumeResult[0]?.avg || 0,
    },

    users: {
      total: totalUsers,
      byRole: usersByRole.reduce((acc, curr) => ({ ...acc, [curr._id || 'UNKNOWN']: curr.count }), {}),
      recent: recentUsers,
      growth: userGrowth
    },

    kyc: {
      stats: kycStats.reduce((acc, curr) => ({ ...acc, [curr._id || 'UNKNOWN']: curr.count }), {}),
      total: kycStats.reduce((acc, curr) => acc + curr.count, 0)
    },

    advertisements: {
      stats: adStats.reduce((acc, curr) => ({ ...acc, [curr._id || 'UNKNOWN']: curr.count }), {}),
      total: adStats.reduce((acc, curr) => acc + curr.count, 0)
    },

    deals: {
      stats: dealStats.reduce((acc, curr) => ({ ...acc, [curr._id || 'UNKNOWN']: curr.count }), {}),
      total: totalDeals,
      volume: totalVolumeResult[0] ? {
        total: totalVolumeResult[0].total,
        avg: totalVolumeResult[0].avg,
        max: totalVolumeResult[0].max,
        min: totalVolumeResult[0].min,
      } : { total: 0, avg: 0, max: 0, min: 0 },
      recent: recentDeals,
      growth: dealGrowth
    },

    auctions: {
      stats: auctionStats.reduce((acc, curr) => ({ ...acc, [curr._id || 'UNKNOWN']: curr.count }), {}),
      total: auctionStats.reduce((acc, curr) => acc + curr.count, 0)
    },

    inventory: {
      stats: inventoryStats.reduce((acc, curr) => ({ ...acc, [curr._id || 'UNKNOWN']: curr.count }), {}),
      total: inventoryStats.reduce((acc, curr) => acc + curr.count, 0)
    }
  };
};

export const getAllAuctionsAdminService = async () => {
  return Auction.find().populate("sellerId", "name email").populate("inventoryId").sort({ createdAt: -1 });
};

export const getAllDealsAdminService = async () => {
  return Deal.find()
    .populate("buyerId", "name email")
    .populate("sellerId", "name email")
    .populate("inventoryId")
    .sort({ createdAt: -1 });
};

export const getAllAdsAdminService = async () => {
  return Advertisement.find().populate("advertiserId", "name email").sort({ createdAt: -1 });
};
