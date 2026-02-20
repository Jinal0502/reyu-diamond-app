import mongoose, { Schema, Types, Document, Model } from "mongoose";

export type InventoryStatus =
  | "available"   // free to list
  | "listed"      // in auction
  | "on_memo"     // memo issued
  | "sold";       // final

export interface IInventory extends Document {
  sellerId: Types.ObjectId;

  title: string;
  description?: string;

  barcode: string;

  // Diamond attributes
  shape:
    | "ROUND"
    | "PRINCESS"
    | "CUSHION"
    | "EMERALD"
    | "OVAL"
    | "RADIANT"
    | "ASSCHER"
    | "MARQUISE"
    | "HEART"
    | "PEAR";

  carat: number;

  cut: "EXCELLENT" | "VERY_GOOD" | "GOOD" | "FAIR" | "POOR";
  color: "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M";
  clarity: "FL" | "IF" | "VVS1" | "VVS2" | "VS1" | "VS2" | "SI1" | "SI2" | "I1";

  lab: string;
  location: string;

  // Pricing
  price: number;             // final / buy-now price
  startingPrice: number;    // OPTIONAL – only for auction
  currency: string;

  // State
  status: InventoryStatus;
  locked: boolean;

  // Media (can be empty at creation)
  images: string[];
  video?: string;

  // Audit (set ONLY from service layer)
  listedAt?: Date;
  soldAt?: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    barcode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    shape: {
      type: String,
      enum: [
        "ROUND",
        "PRINCESS",
        "CUSHION",
        "EMERALD",
        "OVAL",
        "RADIANT",
        "ASSCHER",
        "MARQUISE",
        "HEART",
        "PEAR",
      ],
      required: true,
    },

    carat: {
      type: Number,
      required: true,
      min: 0.01,
    },

    cut: {
      type: String,
      enum: ["EXCELLENT", "VERY_GOOD", "GOOD", "FAIR", "POOR"],
      required: true,
    },

    color: {
      type: String,
      enum: ["D", "E", "F", "G", "H", "I", "J", "K", "L", "M"],
      required: true,
    },

    clarity: {
      type: String,
      enum: ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "I1"],
      required: true,
    },

    lab: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // ✅ OPTIONAL — no "required"
    startingPrice: {
      type: Number,
      min: 0,
      required : true
    },

    currency: {
      type: String,
      default: "USD",
    },

    status: {
      type: String,
      enum: ["available", "listed", "on_memo", "sold"],
      default: "available",
      index: true,
    },

    locked: {
      type: Boolean,
      default: false,
      index: true,
    },

    images: {
      type: [String],
      default: [],
    },

    video: {
      type: String,
    },

    listedAt: {
      type: Date,
    },

    soldAt: {
      type: Date,
    },
  },
  { timestamps: true }
);


InventorySchema.index({
  shape: 1,
  carat: 1,
  color: 1,
  clarity: 1,
  lab: 1,
  location: 1,
});

export const Inventory: Model<IInventory> =
  mongoose.model<IInventory>("Inventory", InventorySchema);
