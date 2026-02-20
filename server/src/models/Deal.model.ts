import mongoose, { Schema, Document, Types } from "mongoose";

export type DealStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "PAYMENT_FAILED"
  | "IN_ESCROW"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

export const DEAL_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  CREATED: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["IN_ESCROW", "CANCELLED"],
  PAYMENT_FAILED : ["PAYMENT_PENDING" , "CANCELLED"],
  IN_ESCROW: ["SHIPPED", "DISPUTED"],
  SHIPPED: ["DELIVERED", "DISPUTED"],
  DELIVERED: ["COMPLETED", "DISPUTED"],
  DISPUTED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export interface IDeal extends Document {
  bidId: Types.ObjectId;
  auctionId: Types.ObjectId;
  inventoryId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;

  dealAmount: number;
  currency: string;
  status: DealStatus;

  payment: {
    isPaid: boolean;
    paidAt?: Date;
  };

  shipping?: {
    courier?: string;
    trackingNumber?: string;
    shippedAt?: Date;
    deliveredAt?: Date;
  };

  dispute?: {
    reason: string;
    raisedBy: Types.ObjectId;
    raisedAt: Date;

    resolvedBy?: Types.ObjectId;
    resolvedAt?: Date;

    resolution?: "REFUND_BUYER" | "RELEASE_SELLER";
    adminNote?: string;
  };
  sellerConfirmedShipped?: boolean;
  buyerConfirmedDelivered?: boolean;
  history: {
    status: DealStatus;
    changedBy: Types.ObjectId;
    changedAt: Date;
    note : String;
  }[];

  pdfPath?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    bidId: {
      type: Schema.Types.ObjectId,
      ref: "Bid",
      required: true,
      unique: true,
      index: true,
    },

    auctionId: {
      type: Schema.Types.ObjectId,
      ref: "Auction",
      required: true,
      index: true,
    },

    inventoryId: {
      type: Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
      index: true,
    },

    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    dealAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: Object.keys(DEAL_TRANSITIONS),
      default: "CREATED",
      index: true,
    },

    payment: {
      isPaid: { type: Boolean, default: false },
      paidAt: Date,
    },

    shipping: {
      courier: String,
      trackingNumber: String,
      shippedAt: Date,
      deliveredAt: Date,
    },

    dispute: {
      reason: String,
      raisedBy: { type: Schema.Types.ObjectId, ref: "User" },
      raisedAt: Date,

      resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
      resolvedAt: Date,

      resolution : {
        type : String,
        enum : ["REFUND_BUYER" , "RELEASE_SELLER"],
      },
      adminNote : String,
    },
    sellerConfirmedShipped: {
      type: Boolean,
      default: false,
    },

    buyerConfirmedDelivered: {
      type: Boolean,
      default: false,
    },

    history: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        changedAt: { type: Date, default: Date.now },
        note : {type : String}
      },
    ],

    pdfPath: String,
  },
  { timestamps: true }
);

export const Deal = mongoose.model<IDeal>("Deal", DealSchema);
