import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    attachments: [
      {
        type: {
          type: String,
          enum: ["image", "pdf", "document"],
        },
        url: String,
        fileName: String,
        size: Number, // in bytes
      },
    ],
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    status: {
      type: String,
      enum: ["SENDING", "SENT", "DELIVERED", "READ"],
      default: "SENT",
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    deliveredAt: {
      type: Date,
    },
    readAt: {
      type: Date,
    },
    editedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
    },
    // Legacy fields for backward compatibility
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    read: { type: Boolean, default: false },
    meta: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
MessageSchema.index({ conversationId: 1, sentAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ conversationId: 1, readAt: 1 });

export interface IMessage extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  text: string;
  attachments?: Array<{
    type: "image" | "pdf" | "document";
    url: string;
    fileName: string;
    size: number;
  }>;
  replyToMessageId?: mongoose.Types.ObjectId;
  status: "SENDING" | "SENT" | "DELIVERED" | "READ";
  sentAt: Date;
  deliveredAt?: Date;
  readAt?: Date;
  editedAt?: Date;
  deletedAt?: Date;
  // Legacy fields
  from?: mongoose.Types.ObjectId;
  to?: mongoose.Types.ObjectId;
  read?: boolean;
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Create text index for message search
MessageSchema.index({ text: "text" });

export default mongoose.model<IMessage>("Message", MessageSchema);
