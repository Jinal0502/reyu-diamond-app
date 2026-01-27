import mongoose, { Schema, Types, Document, Model } from "mongoose";

export type InventoryStatus = "in_locker" | "on_memo" | "sold";

export interface IInventory extends Document {
  sellerId: Types.ObjectId;

  barcode: string;

  shape: string;
  carat: number;
  color: string;
  clarity: string;
  lab: string;

  location: string;

  price: number;
  startingPrice: number;
  currency: string;

  status: InventoryStatus;
  locked: boolean;
}

const InventorySchema = new Schema<IInventory>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    barcode: {
      type: String,
      required: true,
      unique: true, 
      index: true,
    },

    shape: { type: String, required: true },
    carat: { type: Number, required: true },
    color: { type: String, required: true },
    clarity: { type: String, required: true },
    lab: { type: String, required: true },
    location: { type: String, required: true },

    price: { type: Number, required: true },
    startingPrice: { type: Number, required: true, min: 1 },
    currency: { type: String, required: true },

    status: {
      type: String,
      enum: ["in_locker", "on_memo", "sold"],
      default: "in_locker",
    },

    locked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

InventorySchema.index(
  {
    shape: 1,
    carat: 1,
    color: 1,
    clarity: 1,
    lab: 1,
    location: 1,
    price: 1,
  },
  { unique: true, name: "unique_inventory_per_seller" }
);

export const Inventory: Model<IInventory> =
  mongoose.model<IInventory>("Inventory", InventorySchema);
