import mongoose, { Document, Model } from "mongoose";

export type BidStatus = "ACTIVE" | "ACCEPTED" | "REJECTED" | "EXPIRED";

export interface IBid extends Document {
  auctionId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;

  bidAmount: number;

  status: BidStatus;
  isHighestBid: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const bidSchema = new mongoose.Schema<IBid>(
  {
    auctionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Auction",
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

// Only ONE highest bid per auction
bidSchema.index(
  { auctionId: 1, isHighestBid: 1 },
  {
    unique: true,
    partialFilterExpression: { isHighestBid: true },
    name: "unique_highest_bid_per_auction",
  }
);

// Only ONE active bid per user per auction
bidSchema.index(
  { auctionId: 1, buyerId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "ACTIVE" },
    name: "unique_active_bid_per_user_per_auction",
  }
);

export const Bid: Model<IBid> = mongoose.model<IBid>("Bid", bidSchema);
