import mongoose, { Document, Model } from "mongoose";

export type BidStatus =
  | "ACTIVE"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED";

export interface IBid extends Document {
  inventoryId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;

  bidAmount: number;

  status: BidStatus;
  isHighestBid: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new mongoose.Schema<IBid>(
  {
    inventoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    bidAmount: {
      type: Number,
      required: true,
      min: 1,
      index: true,
    },

    status: {
      type: String,
      enum: ["ACTIVE", "ACCEPTED", "REJECTED", "EXPIRED"],
      default: "ACTIVE",
      index: true,
    },

    isHighestBid: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

bidSchema.index(
  { inventoryId: 1, isHighestBid: 1 },
  {
    unique: true,
    partialFilterExpression: { isHighestBid: true },
    name: "unique_highest_bid_per_inventory",
  }
);

export const Bid: Model<IBid> = mongoose.model<IBid>("Bid", bidSchema);