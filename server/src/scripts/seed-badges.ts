import mongoose from "mongoose";
import dotenv from "dotenv";
import { Badge } from "../models/Badge.model";


const badges = [
  {
    badgeId: "deals_10",
    name: "Deca Dealer",
    description: "Successfully completed 10 deals on the platform.",
    icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
    tier: "BRONZE",
    criteria: { completedDeals: 10 },
    isActive: true,
  },
  {
    badgeId: "deals_50",
    name: "Golden Handshake",
    description: "Successfully completed 50 deals on the platform.",
    icon: "https://cdn-icons-png.flaticon.com/512/190/190411.png",
    tier: "GOLD",
    criteria: { completedDeals: 50 },
    isActive: true,
  },
  {
    badgeId: "volume_1m",
    name: "Million Dollar Club",
    description: "Reached a total transaction volume of $1,000,000.",
    icon: "https://cdn-icons-png.flaticon.com/512/3135/3135706.png",
    tier: "PLATINUM",
    criteria: { totalVolume: 1000000 },
    isActive: true,
  },
  {
    badgeId: "rating_5",
    name: "Perfect Rated",
    description: "Maintained a perfect 5-star rating for at least 10 reviews.",
    icon: "https://cdn-icons-png.flaticon.com/512/1828/1828884.png",
    tier: "DIAMOND",
    criteria: { averageRating: 5 },
    isActive: true,
  },
];

import path from "path";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const seedBadges = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) throw new Error("MONGO_URI is not defined in .env file");

    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for Badge Seeding");

    for (const badge of badges) {
      await Badge.findOneAndUpdate(
        { badgeId: badge.badgeId },
        badge,
        { upsert: true, new: true }
      );
      console.log(`Seeded badge: ${badge.name}`);
    }

    console.log("Badge seeding completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Badge seeding failed:", err);
    process.exit(1);
  }
};

seedBadges();
