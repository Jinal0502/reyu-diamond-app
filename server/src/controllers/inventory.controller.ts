import { NextFunction, Request, Response } from "express";
import * as InventoryService from "../services/inventory.service";
import { generateBarcode } from "../utils/barcode.generator";
import { sendResponse } from "../utils/api.response";

/* ================= CREATE ================= */

export const createInventoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.user?._id;

    const inventory = await InventoryService.createInventory({
      ...req.body,
      sellerId,
      barcode: generateBarcode(),
    });

    return sendResponse(res, 201, true, "Inventory item created", inventory);
  } catch (error) {
    next(error);
  }
};

/* ================= UPDATE ================= */

export const updateInventoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventoryId = req.params.inventoryId as string;

    const updatedInventory = await InventoryService.updateInventory(
      inventoryId,
      req.body
    );

    return sendResponse(
      res,
      200,
      true,
      "Inventory item updated",
      updatedInventory
    );
  } catch (error) {
    next(error);
  }
};

/* ================= DELETE ================= */

export const deleteInventoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventoryId = req.params.inventoryId as string;

    await InventoryService.deleteInventory(inventoryId);

    return sendResponse(
      res,
      200,
      true,
      "Inventory deleted successfully",
      null
    );
  } catch (error) {
    next(error);
  }
};

/* ================= GET ================= */

export const getInventory = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventory = await InventoryService.getInventory();
    return sendResponse(res, 200, true, "Inventory fetched", inventory);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventoryId = req.params.inventoryId as string;

    const inventory =
      await InventoryService.getInventoryByIdOrBarcode(inventoryId);

    if (!inventory) {
      return sendResponse(res, 404, false, "Inventory not found", null);
    }

    return sendResponse(res, 200, true, "Inventory fetched", inventory);
  } catch (error) {
    next(error);
  }
};

/* ================= ADD MEDIA ================= */

export const addInventoryMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventoryId = req.params.inventoryId as string;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return sendResponse(res, 400, false, "No files uploaded", null);
    }

    const imageUrls: string[] = [];
    let videoUrl: string | undefined;

    for (const file of files) {
      if (file.mimetype.startsWith("image/")) {
        imageUrls.push(file.path);
      } else if (file.mimetype.startsWith("video/")) {
        videoUrl = file.path;
      }
    }

    const inventory = await InventoryService.addMedia(
      inventoryId,
      imageUrls,
      videoUrl
    );

    return sendResponse(res, 200, true, "Media added successfully", inventory);
  } catch (error) {
    next(error);
  }
};

/* ================= REPLACE MEDIA ================= */

export const replaceInventoryMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventoryId = req.params.inventoryId as string;
    const { type, index } = req.body;
    const files = req.files as Express.Multer.File[];

    const parsedIndex = index !== undefined ? Number(index) : undefined;


    if (!["image", "video"].includes(type)) {
      throw new Error("Invalid media type");
    }

    if (!files || files.length === 0) {
      throw new Error("No files uploaded");
    }

    const mediaUrls = files.map((file) => file.path);

    const inventory = await InventoryService.replaceMedia(
      inventoryId,
      type === "image" ? mediaUrls : undefined,
      type === "video" ? mediaUrls[0] : undefined,
      type === "image" ? parsedIndex : undefined
    );

    return sendResponse(res, 200, true, "Media replaced", inventory);
  } catch (error) {
    next(error);
  }
};

/* ================= REMOVE MEDIA ================= */

export const removeInventoryMedia = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const inventoryId = req.params.inventoryId as string;

    let { removeAllImages = false, removeVideo = false } = req.body;

    // convert string to boolean if needed
    removeAllImages = removeAllImages === true || removeAllImages === "true";
    removeVideo = removeVideo === true || removeVideo === "true";

    if (!removeAllImages && !removeVideo) {
      return sendResponse(
        res,
        400,
        false,
        "Specify removeAllImages or removeVideo",
        null
      );
    }

    const inventory = await InventoryService.removeMedia(
      inventoryId,
      removeAllImages,
      removeVideo
    );

    return sendResponse(res, 200, true, "Media removed successfully", inventory);
  } catch (error) {
    next(error);
  }
};
