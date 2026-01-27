import mongoose, { Schema, Types, Model } from "mongoose";

export interface IRequirement {
  userId: Types.ObjectId;

  intent: {
    shape: string[];
    carat: {
      min: number;
      max: number;
    };
    color: string[];
    clarity: string[];
    lab: boolean;
  };

  constraints: {
    budget: number;
    currency: string;
    location: string[];
    deadline: Date;
  };

  preferences?: {
    cut?: string[];
    polish?: string[];
    symmetry?: string[];
    fluorescence?: string[];
    certificate?: string[];
    notes?: string;
  };
  status?: "active" | "close" | "expired";
}

const RequirementSchema = new Schema<IRequirement>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    intent: {
      shape: { type: [String], required: true },
      carat: {
        min: { type: Number, required: true },
        max: { type: Number, required: true },
      },
      color: { type: [String], required: true },
      clarity: { type: [String], required: true },
      lab: { type: Boolean, required: true },
    },

    constraints: {
      budget: { type: Number, required: true },
      currency: { type: String, required: true },
      location: { type: [String], required: true },
      deadline: { type: Date, required: true, index: true },
    },

    preferences: {
      cut: [String],
      polish: [String],
      symmetry: [String],
      fluorescence: [String],
      certificate: [String],
      notes: String,
    },
    status: {
    type: String,
    enum: ["active", "close", "expired"],
    default: "active",
},
  },
  { timestamps: true }
);

export const Requirement: Model<IRequirement> =
  mongoose.model<IRequirement>("Requirement", RequirementSchema);
