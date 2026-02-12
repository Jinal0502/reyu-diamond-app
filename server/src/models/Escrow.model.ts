import mongoose, { Document, Model, Schema } from "mongoose";

export type EscrowStatus =
  | "PENDING"             // escrow created but payment not initiated
  | "PAYMENT_INITIATED"   // paymentIntent created
  | "HELD"                // payment succeeded, money held in platform
  | "RELEASED"            // money transferred to seller
  | "REFUNDED"            // refunded to buyer
  | "CANCELLED"           // cancelled before payment
  | "FAILED";             // payment failed

export interface IEscrow extends Document {
  dealId: mongoose.Types.ObjectId;
  buyerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;

  amount: number;
  currency: string;
  status: EscrowStatus;

  stripePaymentIntentId?: string;
  stripeChargeId?: string;

  stripeTransferId?: string;
  stripeRefundId?: string;

  createdAt: Date;
  updatedAt: Date;
}

const escrowSchema = new Schema<IEscrow>(
  {
    dealId: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      required: true,
      unique: true, // only one escrow per deal
    },

    buyerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "usd",
    },

    status: {
      type: String,
      enum: [
        "PENDING",
        "PAYMENT_INITIATED",
        "HELD",
        "RELEASED",
        "REFUNDED",
        "CANCELLED",
        "FAILED",
      ],
      default: "PENDING",
    },

    stripePaymentIntentId: {
      type: String,
      trim: true,
    },

    stripeChargeId: {
      type: String,
      trim: true,
    },

    stripeTransferId: {
      type: String,
      trim: true,
    },

    stripeRefundId: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Escrow: Model<IEscrow> = mongoose.model<IEscrow>("Escrow", escrowSchema);

export default Escrow;
