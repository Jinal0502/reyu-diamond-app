import mongoose, {Schema , Document , Types} from "mongoose";

export type DealStatus =
  | "CREATED"
  | "PAYMENT_PENDING"
  | "IN_ESCROW"
  | "SHIPPED"
  | "DELIVERED"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";

export const DEAL_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  CREATED: ["PAYMENT_PENDING", "CANCELLED"],
  PAYMENT_PENDING: ["IN_ESCROW", "CANCELLED"],
  IN_ESCROW: ["SHIPPED", "DISPUTED"],
  SHIPPED: ["DELIVERED", "DISPUTED"],
  DELIVERED: ["COMPLETED", "DISPUTED"],
  DISPUTED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export interface IDeal extends Document {
  bidId: Types.ObjectId;
  inventoryId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;

  dealAmount: number;
  currency: string;
  status: DealStatus;

  payment: {
    isPaid: boolean;
    paidAt?: Date;
    method?: string;
    transactionId?: string;
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
    resolvedAt?: Date;
    resolution?: string;
  };

  history: {
    status: DealStatus;
    changedBy: Types.ObjectId;
    changedAt: Date;
  }[];

  pdfPath?: string;

  createdAt: Date;
  updatedAt: Date;
}

const DealSchema = new Schema<IDeal>(
  {
    bidId: { type: Schema.Types.ObjectId, ref: "Bid", required: true, unique: true },
    inventoryId: { type: Schema.Types.ObjectId, ref: "Inventory", required: true, index: true },
    buyerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    dealAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    status: {
      type: String,
      enum: [
        "CREATED",
        "PAYMENT_PENDING",
        "IN_ESCROW",
        "SHIPPED",
        "DELIVERED",
        "COMPLETED",
        "DISPUTED",
        "CANCELLED",
      ],
      default: "CREATED",
      index: true,
    },

    payment: {
      isPaid: { type: Boolean, default: false },
      paidAt: Date,
      method: String,
      transactionId: String,
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
      resolvedAt: Date,
      resolution: String,
    },

    history: [
      {
        status: { type: String, required: true },
        changedBy: { type: Schema.Types.ObjectId, ref: "User" },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    pdfPath: String,
  },
  { timestamps: true }
);

export const Deal = mongoose.model<IDeal>("Deal", DealSchema);
