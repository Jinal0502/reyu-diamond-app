import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBadgeProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface IUserBadge extends Document {
  userId: Types.ObjectId;
  badgeId: string;

  earnedAt?: Date | null;

  progress: IBadgeProgress;
  isEarned: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const UserBadgeSchema = new Schema<IUserBadge>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    badgeId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    earnedAt: {
      type: Date,
      default: null,
    },

    progress: {
      current: { type: Number, default: 0 },
      target: { type: Number, default: 1 },   // FIXED
      percentage: { type: Number, default: 0 },
    },

    isEarned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

UserBadgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

export const UserBadge = mongoose.model<IUserBadge>("UserBadge", UserBadgeSchema);
