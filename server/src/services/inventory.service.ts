import { Inventory, IInventory } from "../models/Inventory.model";
import { Types } from "mongoose";
import {
  deleteFolderByPrefix,
  deleteSingleFile,
} from "../utils/cloundinary.delete";

/* ================= CLOUDINARY PUBLIC ID EXTRACTOR ================= */

const getPublicIdFromUrl = (url: string): string => {
  const cleanUrl = url.split("?")[0];

  // example:
  // https://res.cloudinary.com/dnwy44rve/image/upload/v1700000000/inventory/12345/img_abc.jpg

  const uploadIndex = cleanUrl.indexOf("/upload/");
  if (uploadIndex === -1) throw new Error("Invalid Cloudinary URL");

  let publicIdWithExt = cleanUrl.substring(uploadIndex + "/upload/".length);

  // remove version v12345/
  publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, "");

  // remove file extension
  const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");

  return publicId;
};

/* ================= CREATE ================= */

export const createInventory = async (data: Partial<IInventory>) => {
  
  if (!data.sellerId) throw new Error("Seller ID is required");

  data.status = "available";
  data.locked = false;

  return Inventory.create(data);
};

/* ================= UPDATE ================= */

export const updateInventory = async (
  inventoryId: string,
  updates: Partial<IInventory>
) => {
  const inventory = await Inventory.findById(inventoryId);

  if (!inventory) throw new Error("Inventory not found");
  if (inventory.locked) throw new Error("Inventory is locked");

  delete updates.soldAt;
  delete updates.listedAt;

  return Inventory.findOneAndUpdate(
    { _id: inventoryId, locked: false },
    updates,
    { new: true }
  );
};

/* ================= DELETE ================= */

export const deleteInventory = async (inventoryId: string) => {
  const deleted = await Inventory.findOneAndDelete({
    _id: inventoryId,
    locked: false,
  });

  if (!deleted) throw new Error("Inventory not found or locked");

  // 🔥 delete everything from cloudinary folder
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

export const addMedia = async (
  inventoryId: string,
  images: string[] = [],
  video?: string
) => {
  const inventory = await Inventory.findById(inventoryId);

  if (!inventory) throw new Error("Inventory not found");
  if (inventory.locked) throw new Error("Inventory is locked");

  if (images.length) inventory.images.push(...images);

  if (video && inventory.video) {
    throw new Error("Only one video is allowed per inventory");
  }

  if (video) inventory.video = video;

  await inventory.save();
  return inventory;
};

/* ================= REPLACE MEDIA ================= */

export const replaceMedia = async (
  inventoryId: string,
  images?: string[],
  video?: string,
  index?: number
) => {
  const inventory = await Inventory.findById(inventoryId);

  if (!inventory) throw new Error("Inventory not found");
  if (inventory.locked) throw new Error("Inventory is locked");

  // replace image(s)
  if (images) {
    if (typeof index === "number") {
      if (index < 0 || index >= inventory.images.length) {
        throw new Error("Invalid image index");
      }

      // delete old image from cloudinary
      const oldImageUrl = inventory.images[index];
      const oldPublicId = getPublicIdFromUrl(oldImageUrl);
      await deleteSingleFile(oldPublicId);

      inventory.images[index] = images[0];
    } else {
      // delete all old images
      for (const imgUrl of inventory.images) {
        const publicId = getPublicIdFromUrl(imgUrl);
        await deleteSingleFile(publicId);
      }

      inventory.images = images;
    }
  }

  // replace video
  if (video) {
    if (inventory.video) {
      const oldVideoPublicId = getPublicIdFromUrl(inventory.video);
      await deleteSingleFile(oldVideoPublicId);
    }

    inventory.video = video;
  }

  await inventory.save();
  return inventory;
};

/* ================= REMOVE MEDIA ================= */

export const removeMedia = async (
  inventoryId: string,
  removeAllImages: boolean = false,
  removeVideo: boolean = false
) => {
  const inventory = await Inventory.findById(inventoryId);

  if (!inventory) throw new Error("Inventory not found");
  if (inventory.locked) throw new Error("Inventory is locked");

  // ✅ if removing everything -> delete folder directly
  if (removeAllImages && removeVideo) {
    await deleteFolderByPrefix(`inventory/${inventoryId}`);

    inventory.images = [];
    inventory.video = undefined;

    await inventory.save();
    return inventory;
  }

  // ✅ remove all images only
  if (removeAllImages && inventory.images.length > 0) {
    for (const imgUrl of inventory.images) {
      const publicId = getPublicIdFromUrl(imgUrl);
      await deleteSingleFile(publicId);
    }

    inventory.images = [];
  }

  // ✅ remove video only
  if (removeVideo && inventory.video) {
    const publicId = getPublicIdFromUrl(inventory.video);
    await deleteSingleFile(publicId);

    inventory.video = undefined;
  }

  await inventory.save();
  return inventory;
};
