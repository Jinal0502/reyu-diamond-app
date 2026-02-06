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
    labName?: string[]; // optional: preferred labs
  };

  constraints: {
    budget: number;
    currency: string;
    location: string[];
    pricePerCarat?: {
      min?: number;
      max?: number;
    };
  };

  preferences?: {
    cut?: string[];
    polish?: string[];
    symmetry?: string[];
    fluorescence?: string[];
    certificate?: string[];
    notes?: string;
    priority?: number; // higher number = higher priority
    isActive?: boolean; // if the preference is currently active
  };

  matchedInventoryIds?: Types.ObjectId[]; // optional: track matching inventory
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
        min: { type: Number, required: true, min: 0 },
        max: { type: Number, required: true, min: 0 },
      },
      color: { type: [String], required: true },
      clarity: { type: [String], required: true },
      lab: { type: Boolean, required: true },
      labName: { type: [String], default: [] },
    },

    constraints: {
      budget: { type: Number, required: true, min: 0 },
      currency: { type: String, required: true, default: "INR" },
      location: { type: [String], required: true },
      pricePerCarat: {
        min: { type: Number, min: 0 },
        max: { type: Number, min: 0 },
      },
    },

    preferences: {
      cut: { type: [String], default: [] },
      polish: { type: [String], default: [] },
      symmetry: { type: [String], default: [] },
      fluorescence: { type: [String], default: [] },
      certificate: { type: [String], default: [] },
      notes: { type: String, maxlength: 500 },
      priority: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true },
    },

    matchedInventoryIds: { type: [Schema.Types.ObjectId], ref: "Inventory", default: [] },
  },
  { timestamps: true }
);

export const Requirement: Model<IRequirement> =
  mongoose.model<IRequirement>("Requirement", RequirementSchema);
