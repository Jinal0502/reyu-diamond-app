import { NextFunction, Request, Response } from "express";
import * as InventoryService from "../services/inventory.service";
import { generateBarcode } from "../utils/barcode.generator";
import { sendResponse } from "../utils/api.response";


export const createInventoryItem = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.user?._id as any;

    const inventory = await InventoryService.createInventory({
      ...req.body,
      sellerId,
      barcode: generateBarcode(),
    });

    return sendResponse(
      res,
      201,
      true,
      "Inventory item created",
      inventory
    );
  } catch (error: any) {
    next(error);
  }
};


export const updateInventoryItem = async (
  req: Request,
  res: Response
) => {
  try {
    const inventoryId = req.params.inventoryId as string;

    const updatedInventory = await InventoryService.updateInventory(
      inventoryId,
      req.body
    );

    if (!updatedInventory) {
      return sendResponse(
        res,
        400,
        false,
        "Inventory is locked",
        null
      );
    }

    return sendResponse(
      res,
      200,
      true,
      "Inventory item updated",
      updatedInventory
    );
  } catch (error: any) {
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to update inventory",
      null
    );
  }
};


export const deleteInventoryItem = async (
  req: Request,
  res: Response
) => {
  try {
    const inventoryId = req.params.inventoryId as string;

    const deletedInventory = await InventoryService.deleteInventory(
      inventoryId,
    );

    if (!deletedInventory) {
      return sendResponse(
        res,
        400,
        false,
        "Inventory not found or locked",
        null
      );
    }

    return sendResponse(
      res,
      200,
      true,
      "Inventory deleted successfully",
      null
    );
  } catch (error: any) {
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to delete inventory",
      null
    );
  }
};


export const getInventory = async (
  req: Request,
  res: Response
) => {
  try {
    const inventory = await InventoryService.getInventory();

    return sendResponse(
      res,
      200,
      true,
      "Inventory fetched successfully",
      inventory
    );
  } catch (error: any) {
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to fetch inventory",
      null
    );
  }
};

export const getInventoryItem = async (
  req: Request,
  res: Response
) => {
  try {
    const inventoryId = req.params.inventoryId as string; // 👈 explicit cast (response #2)

    const inventory =
      await InventoryService.getInventoryByIdOrBarcode(inventoryId);

    if (!inventory) {
      return sendResponse(res, 404, false, "Inventory not found", null);
    }

    return sendResponse(
      res,
      200,
      true,
      "Inventory fetched successfully",
      inventory
    );
  } catch (error: any) {
    return sendResponse(
      res,
      500,
      false,
      error.message || "Failed to fetch inventory",
      null
    );
  }
};
