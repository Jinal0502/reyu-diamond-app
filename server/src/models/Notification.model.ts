import mongoose, { Document, Schema } from "mongoose";

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  title: string;
  body: string;
  data?: Record<string, any>;
  type: "BID" | "AUCTION" | "DEAL" | "PAYMENT" | "CHAT" | "KYC" | "ADMIN" | "ADS" | "RATING" | "SYSTEM";
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    data: {
      type: Schema.Types.Mixed, // deep link / metadata
      default: {},
    },
    type: {
      type: String,
      enum: [
        "BID",
        "AUCTION",
        "DEAL",
        "PAYMENT",
        "CHAT",
        "KYC",
        "ADMIN",
        "ADS",
        "RATING",
        "SYSTEM",
      ],
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// 🔥 Indexes (important for performance)
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ recipient: 1, createdAt: -1 });

export default mongoose.model<INotification>(
  "Notification",
  notificationSchema
);