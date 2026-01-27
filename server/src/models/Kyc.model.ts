import mongoose, { Schema, Model, Types, Document } from "mongoose";
import crypto from "crypto";

export type KycStatus = "pending" | "approved" | "rejected";

const hashValue = (value: string) =>
  crypto.createHash("sha256").update(value).digest("hex");

interface IKycDocuments {
  aadhaar: {
    aadhaarHash: string;
    aadhaarLast4: string;
    url: string;
    publicId: string;
  };
  pan: {
    panHash: string;
    panLast4: string;
    url: string;
    publicId: string;
  };
  selfie: {
    url: string;
    publicId: string;
  };
}

export interface IKyc extends Document {
  userId: Types.ObjectId;
  name: string;
  documents: IKycDocuments;
  status: KycStatus;
  rejectionReason?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
}

const KycSchema = new Schema<IKyc>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    documents: {
      type: new Schema(
        {
          aadhaar: {
            aadhaarHash: {
              type: String,
              required: true,
              select: false, 
            },
            aadhaarLast4: {
              type: String,
              required: true,
              validate: {
                validator: (v: string) => /^\d{4}$/.test(v),
                message: "Invalid Aadhaar last 4 digits",
              },
            },
            url: { type: String, required: true },
            publicId: { type: String, required: true },
          },

          pan: {
            panHash: {
              type: String,
              required: true,
              select: false, // 🔒 hidden by default
            },
            panLast4: {
              type: String,
              required: true,
              uppercase: true,
              validate: {
                validator: (v: string) => /^[0-9A-Z]{4}$/.test(v),
                message: "Invalid PAN last 4 characters",
              },
            },
            url: { type: String, required: true },
            publicId: { type: String, required: true },
          },

          selfie: {
            url: { type: String, required: true },
            publicId: { type: String, required: true },
          },
        },
        { _id: false }
      ),
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },

    rejectionReason: {
      type: String,
      trim: true,
      required: function (this: IKyc) {
        return this.status === "rejected";
      },
    },

    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const KYC: Model<IKyc> = mongoose.model<IKyc>("KYC", KycSchema);
