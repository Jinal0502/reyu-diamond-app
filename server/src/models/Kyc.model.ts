import mongoose, { Schema, Model, Types, Document } from "mongoose";

export type KycStatus = "pending" | "approved" | "rejected";

interface IKycDocuments {
  aadhaar: { url: string; publicId: string };
  pan: { url: string; publicId: string };
  selfie: { url: string; publicId: string };
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
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true },

    documents: {
      type: new Schema(
        {
          aadhaar: { url: { type: String, required: true }, publicId: { type: String, required: true } },
          pan: { url: { type: String, required: true }, publicId: { type: String, required: true } },
          selfie: { url: { type: String, required: true }, publicId: { type: String, required: true } },
        },
        { _id: false }
      ),
      required: true,
    },

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },

    rejectionReason: {
      type: String,
      trim: true,
      required: function (this: any) {
        return this.status === "rejected";
      },
    },

    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    verifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const KYC: Model<IKyc> = mongoose.model<IKyc>("KYC", KycSchema);
