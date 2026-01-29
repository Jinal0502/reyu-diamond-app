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
  updates: Partial<IInventory>
) => {

  const inventory = await Inventory.findById(inventoryId);
  console.log("Inventory found for update:", inventory);
  if (!inventory) {
    throw new Error("Inventory not found");
  }
  return Inventory.findOneAndUpdate(
    {
      _id: inventoryId,
      locked: false,
    },
    updates,
    { new: true }
  );
};

export const deleteInventory = async (
  inventoryId: string,
) => {
  return Inventory.findOneAndDelete({
    _id: inventoryId,
    locked: false,
  });
};

export const getInventory = async () => {
  return Inventory.find().sort({ createdAt: -1 });
};

export const getInventoryByIdOrBarcode = async (
  inventoryId: string
) => {
  return Inventory.findOne({
    $or: [{ _id: inventoryId }, { barcode: inventoryId }],
  });
};
