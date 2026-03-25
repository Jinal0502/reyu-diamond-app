import { NextFunction, Request, Response } from "express";
import * as InventoryService from "../services/inventory.service";
import { generateBarcode, sendResponse, CustomError, ErrorCode, HTTP_STATUS, SuccessCode, SUCCESS_MESSAGES } from "../utils";

const param = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

export const createInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory = await InventoryService.createInventory({
      ...req.body,
      sellerId: req.user?._id,
      barcode: generateBarcode(),
    });
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.INVENTORY_CREATED], inventory, undefined, SuccessCode.INVENTORY_CREATED);
  } catch (error) {
    next(error);
  }
};

export const updateInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedInventory = await InventoryService.updateInventory(param(req.params.inventoryId), req.body);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.INVENTORY_UPDATED], updatedInventory, undefined, SuccessCode.INVENTORY_UPDATED);
  } catch (error) {
    next(error);
  }
};

export const deleteInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await InventoryService.deleteInventory(param(req.params.inventoryId));
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.INVENTORY_DELETED], null, undefined, SuccessCode.INVENTORY_DELETED);
  } catch (error) {
    next(error);
  }
};

export const getInventory = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory = await InventoryService.getInventory();
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.INVENTORY_FETCHED], inventory, undefined, SuccessCode.INVENTORY_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getInventoryItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const inventory = await InventoryService.getInventoryByIdOrBarcode(param(req.params.inventoryId));

    if (!inventory) {
      return sendResponse(res, 404, false, "Inventory not found", null, undefined, ErrorCode.NOT_FOUND);
    }

    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.INVENTORY_FETCHED], inventory, undefined, SuccessCode.INVENTORY_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const addInventoryMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return sendResponse(res, 400, false, "No files uploaded", null, undefined, ErrorCode.VALIDATION_ERROR);
    }

    const imageUrls: string[] = [];
    let videoUrl: string | undefined;

    for (const file of files) {
      if (file.mimetype.startsWith("image/")) imageUrls.push(file.path);
      else if (file.mimetype.startsWith("video/")) videoUrl = file.path;
    }

    const inventory = await InventoryService.addMedia(param(req.params.inventoryId), imageUrls, videoUrl);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.MEDIA_ADDED], inventory, undefined, SuccessCode.MEDIA_ADDED);
  } catch (error) {
    next(error);
  }
};

export const replaceInventoryMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, index } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!["image", "video"].includes(type)) {
      throw new CustomError("Invalid media type", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }

    if (!files || files.length === 0) {
      throw new CustomError("No files uploaded", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    }

    const mediaUrls = files.map((f) => f.path);
    const parsedIndex = index !== undefined ? Number(index) : undefined;

    const inventory = await InventoryService.replaceMedia(
      param(req.params.inventoryId),
      type === "image" ? mediaUrls : undefined,
      type === "video" ? mediaUrls[0] : undefined,
      type === "image" ? parsedIndex : undefined
    );

    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.MEDIA_REPLACED], inventory, undefined, SuccessCode.MEDIA_REPLACED);
  } catch (error) {
    next(error);
  }
};

export const removeInventoryMedia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { removeAllImages = false, removeVideo = false } = req.body;
    removeAllImages = removeAllImages === true || removeAllImages === "true";
    removeVideo = removeVideo === true || removeVideo === "true";

    if (!removeAllImages && !removeVideo) {
      return sendResponse(res, 400, false, "Specify removeAllImages or removeVideo", null, undefined, ErrorCode.VALIDATION_ERROR);
    }

    const inventory = await InventoryService.removeMedia(param(req.params.inventoryId), removeAllImages, removeVideo);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.MEDIA_REMOVED], inventory, undefined, SuccessCode.MEDIA_REMOVED);
  } catch (error) {
    next(error);
  }
};
