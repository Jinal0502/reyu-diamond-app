import { Inventory, IInventory } from "../models/Inventory.model";
import { Types } from "mongoose";
import { deleteFolderByPrefix, deleteSingleFile, CustomError, ErrorCode, HTTP_STATUS } from "../utils";
import logger from "../utils/logger";

/* ================= CLOUDINARY PUBLIC ID EXTRACTOR ================= */

const getPublicIdFromUrl = (url: string): string => {
  const cleanUrl = url.split("?")[0];

  const uploadIndex = cleanUrl.indexOf("/upload/");
  if (uploadIndex === -1) {
    throw new CustomError("Invalid Cloudinary URL", HTTP_STATUS.BAD_REQUEST, ErrorCode.BAD_REQUEST);
  }

  let publicIdWithExt = cleanUrl.substring(uploadIndex + "/upload/".length);
  publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, "");
  const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");

  return publicId;
};

/* ================= CREATE ================= */

export const createInventory = async (data: Partial<IInventory>) => {
  if (!data.sellerId) {
    throw new CustomError("Seller ID is required", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  data.status = "available";
  data.locked = false;

  const inventory = await Inventory.create(data);
  logger.info("Inventory item created", { inventoryId: inventory._id, sellerId: data.sellerId });
  return inventory;
};

/* ================= UPDATE ================= */

export const updateInventory = async (inventoryId: string, updates: Partial<IInventory>) => {
  const inventory = await Inventory.findById(inventoryId);

  if (!inventory) throw new CustomError("Inventory not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  if (inventory.locked) throw new CustomError("Inventory is locked", HTTP_STATUS.FORBIDDEN, ErrorCode.INVENTORY_LOCKED);

  delete updates.soldAt;
  delete updates.listedAt;

  return Inventory.findOneAndUpdate({ _id: inventoryId, locked: false }, updates, { new: true });
};

/* ================= DELETE ================= */

export const deleteInventory = async (inventoryId: string) => {
  const deleted = await Inventory.findOneAndDelete({ _id: inventoryId, locked: false });

  if (!deleted) {
    throw new CustomError("Inventory not found or locked", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  logger.info("Inventory deleted", { inventoryId });
  await deleteFolderByPrefix(`inventory/${inventoryId}`);
};

/* ================= GET ================= */

export const getInventory = async () => {
  return Inventory.find().sort({ createdAt: -1 });
};

export const getInventoryByIdOrBarcode = async (value: string) => {
  const filters: any[] = [{ barcode: value }];

  if (Types.ObjectId.isValid(value)) {
    filters.push({ _id: value });
  }

  return Inventory.findOne({ $or: filters });
};

/* ================= ADD MEDIA ================= */

export const addMedia = async (inventoryId: string, images: string[] = [], video?: string) => {
  const inventory = await Inventory.findById(inventoryId);

  if (!inventory) throw new CustomError("Inventory not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  if (inventory.locked) throw new CustomError("Inventory is locked", HTTP_STATUS.FORBIDDEN, ErrorCode.INVENTORY_LOCKED);

  if (images.length) inventory.images.push(...images);

  if (video && inventory.video) {
    throw new CustomError("Only one video is allowed per inventory", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  if (video) inventory.video = video;

  await inventory.save();
  return inventory;
};

/* ================= REPLACE MEDIA ================= */

export const replaceMedia = async (inventoryId: string, images?: string[], video?: string, index?: number) => {
  const inventory = await Inventory.findById(inventoryId);

  if (!inventory) throw new CustomError("Inventory not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  if (inventory.locked) throw new CustomError("Inventory is locked", HTTP_STATUS.FORBIDDEN, ErrorCode.INVENTORY_LOCKED);

  if (images) {
    if (typeof index === "number") {
      if (index < 0 || index >= inventory.images.length) {
        throw new CustomError("Invalid image index", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
      }

      const oldPublicId = getPublicIdFromUrl(inventory.images[index]);
      await deleteSingleFile(oldPublicId);
      inventory.images[index] = images[0];
    } else {
      for (const imgUrl of inventory.images) {
        await deleteSingleFile(getPublicIdFromUrl(imgUrl));
      }
      inventory.images = images;
    }
  }

  if (video) {
    if (inventory.video) {
      await deleteSingleFile(getPublicIdFromUrl(inventory.video));
    }
    inventory.video = video;
  }

  await inventory.save();
  return inventory;
};

/* ================= REMOVE MEDIA ================= */

export const removeMedia = async (inventoryId: string, removeAllImages: boolean = false, removeVideo: boolean = false) => {
  const inventory = await Inventory.findById(inventoryId);

  if (!inventory) throw new CustomError("Inventory not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  if (inventory.locked) throw new CustomError("Inventory is locked", HTTP_STATUS.FORBIDDEN, ErrorCode.INVENTORY_LOCKED);

  if (removeAllImages && removeVideo) {
    await deleteFolderByPrefix(`inventory/${inventoryId}`);
    inventory.images = [];
    inventory.video = undefined;
    await inventory.save();
    return inventory;
  }

  if (removeAllImages && inventory.images.length > 0) {
    for (const imgUrl of inventory.images) {
      await deleteSingleFile(getPublicIdFromUrl(imgUrl));
    }
    inventory.images = [];
  }

  if (removeVideo && inventory.video) {
    await deleteSingleFile(getPublicIdFromUrl(inventory.video));
    inventory.video = undefined;
  }

  await inventory.save();
  return inventory;
};
