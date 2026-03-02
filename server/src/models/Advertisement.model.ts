import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MediaType = "image" | "video";
export type AdStatus = "PENDING" | "APPROVED" | "REJECTED" | "DISABLED";
export type BannerSection =
  | "HOME_DASHBOARD"
  | "MARKETPLACE"
  | "BANNER_ZONES";

export interface IAdvertisement extends Document {
  advertiserId: Types.ObjectId;
  inventoryId?: Types.ObjectId;

  title: string;
  description?: string;

  mediaUrl: string;
  mediaType: MediaType;

  ctaLink?: string;

  bannerSection: BannerSection[];

  status: AdStatus;
  rejectionReason?: string;

  startDate?: Date;
  endDate?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>(
  {
    advertiserId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      default: null,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 120,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },

    mediaUrl: {
      type: String,
      required: true,
    },

    mediaType: {
      type: String,
      enum: ["image", "video"],
      required: true,
      index: true,
    },

    ctaLink: {
      type: String,
      trim: true,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: "Invalid URL format",
      },
    },

    bannerSection: {
      type: [String],
      enum: ["HOME_DASHBOARD", "MARKETPLACE", "BANNER_ZONES"],
      default: ["BANNER_ZONES"],
      index: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "APPROVED", "REJECTED", "DISABLED"],
      default: "PENDING",
      index: true,
    },

    rejectionReason: {
      type: String,
      maxlength: 500,
      trim: true,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/* ---------- Indexes (IMPORTANT for ads performance) ---------- */

AdvertisementSchema.index({ status: 1, startDate: 1, endDate: 1 });
AdvertisementSchema.index({ bannerSection: 1, status: 1 });
AdvertisementSchema.index({ advertiserId: 1, status: 1 });

export const Advertisement: Model<IAdvertisement> =
  mongoose.models.Advertisement ||
  mongoose.model<IAdvertisement>("Advertisement", AdvertisementSchema);