import mongoose, { Schema, Document, Types } from "mongoose";

export interface IRatingCategories {
  communication?: number;
  productQuality?: number;
  delivery?: number;
  pricing?: number;
  professionalism?: number;
}

export interface IRating extends Document {
  userId: Types.ObjectId;     // who is being rated
  raterId: Types.ObjectId;    // who rated
  dealId: Types.ObjectId;

  rating: number;
  categories?: IRatingCategories;

  review?: string;
  isAnonymous: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    raterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    dealId: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      required: true,
      index: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    categories: {
      communication: { type: Number, min: 1, max: 5 },
      productQuality: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
      pricing: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
    },

    review: {
      type: String,
      minlength: 10,
      maxlength: 1000,
      trim: true,
    },

    isAnonymous: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Prevent multiple ratings from same rater for same deal
RatingSchema.index({ dealId: 1, raterId: 1 }, { unique: true });

// Fetch ratings fast
RatingSchema.index({ userId: 1, createdAt: -1 });
RatingSchema.index({ raterId: 1, createdAt: -1 });

export const Rating = mongoose.model<IRating>("Rating", RatingSchema);
