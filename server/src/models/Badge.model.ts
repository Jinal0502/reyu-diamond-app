import mongoose, { Schema, Document } from "mongoose";

export type BadgeTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";

export interface IBadge extends Document {
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  criteria: any;
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const BadgeSchema = new Schema<IBadge>(
  {
    badgeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    icon: {
      type: String,
      required: true,
      trim: true,
    },

    tier: {
      type: String,
      enum: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"],
      required: true,
    },

    criteria: {
      type: Schema.Types.Mixed,
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const Badge = mongoose.model<IBadge>("Badge", BadgeSchema);
