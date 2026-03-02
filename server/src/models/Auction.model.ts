import mongoose, { Schema, Document, Model } from "mongoose";

export type AuctionStatus = "upcoming" | "active" | "ended" | "cancelled";

export interface IAuction extends Document {
  inventoryId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;

  basePrice: number;
  currentBid: number;

  highestBidderId?: mongoose.Types.ObjectId;
  highestBidId?: mongoose.Types.ObjectId;

  bidIds: mongoose.Types.ObjectId[];

  startDate: Date;
  endDate: Date;

  status: AuctionStatus;
  locked: boolean;

  endedAt?: Date;
  cancelledAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const AuctionSchema: Schema<IAuction> = new Schema(
  {
    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      unique: true,
      index: true,
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    basePrice: {
      type: Number,
      required: true,
      min: 0,
    },

    currentBid: {
      type: Number,
      required: true,
      min: 0,
      default: function (this: IAuction) {
        return this.basePrice;
      },
    },

    highestBidderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    highestBidId: {
      type: Schema.Types.ObjectId,
      ref: "Bid",
    },

    bidIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Bid",
        default: [],
      },
    ],

    startDate: {
      type: Date,
      required: true,
      index: true,
    },

    endDate: {
      type: Date,
      required: true,
      validate: {
        validator: function (value: Date) {
          return value > (this as any).startDate;
        },
        message: "End date must be after start date",
      },
    },

    status: {
      type: String,
      enum: ["upcoming", "active", "ended", "cancelled"],
      default: "upcoming",
      index: true,
    },

    locked: {
      type: Boolean,
      default: false,
    },

    endedAt: Date,
    cancelledAt: Date,
  },
  {
    timestamps: true,
  }
);

AuctionSchema.index({ status: 1 , startDate: 1 });
AuctionSchema.index({ status: 1, endDate: 1 });

export const Auction: Model<IAuction> =
  mongoose.models.Auction || mongoose.model<IAuction>("Auction", AuctionSchema);
