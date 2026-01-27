import { Inventory, IInventory } from "../models/Inventory.model";
import { Types } from "mongoose";

export const createInventory = async (
  data: Partial<IInventory>
) => {
  if (!data.sellerId) {
    throw new Error("Seller ID is required");
  }

  return Inventory.create(data);
};

export const updateInventory = async (
  inventoryId: string,
  sellerId: Types.ObjectId,
  updates: Partial<IInventory>
) => {
  return Inventory.findOneAndUpdate(
    {
      _id: inventoryId,
      sellerId,
      locked: false,
    },
    updates,
    { new: true }
  );
};

export const deleteInventory = async (
  inventoryId: string,
  sellerId: Types.ObjectId
) => {
  return Inventory.findOneAndDelete({
    _id: inventoryId,
    sellerId,
    locked: false,
  });
};

export const getInventory = async () => {
  return Inventory.find().sort({ createdAt: -1 });
};

export const getInventoryByIdOrBarcode = async (
  id: string
) => {
  return Inventory.findOne({
    $or: [{ _id: id }, { barcode: id }],
  });
};
