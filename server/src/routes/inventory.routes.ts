import { Router } from "express";
import * as InventoryController from "../controllers/inventory.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOrRole} from "../middlewares/permission.middleware";
import { Inventory } from "../models/Inventory.model";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware";
import { inventoryUpload } from "../middlewares/inventoryUpload.middleware";
import { inventoryLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

router.get(
  "/",
  InventoryController.getInventory
);

router.get(
  "/:inventoryId",
  InventoryController.getInventoryItem
);

router.post(
  "/",
  protect,
  inventoryLimiter,
  kycVerifiedOnly,
  InventoryController.createInventoryItem
);

router.put(
  "/:inventoryId",
  protect,
  inventoryLimiter,
  kycVerifiedOnly,
  ownerOrRole(Inventory , "sellerId" , [] , "inventoryId"),
  InventoryController.updateInventoryItem
);

router.delete(
  "/:inventoryId",
  protect,
  inventoryLimiter,
  kycVerifiedOnly,
  ownerOrRole(Inventory , "sellerId" , [] , "inventoryId"),
  InventoryController.deleteInventoryItem
);

router.post(
  "/:inventoryId/media",
  protect,
  inventoryLimiter,
  kycVerifiedOnly,
  ownerOrRole(Inventory , "sellerId" , [] , "inventoryId"),
  inventoryUpload.array("media" , 6),
  InventoryController.addInventoryMedia
);

router.put(
  "/:inventoryId/media",
  protect,
  inventoryLimiter,
  kycVerifiedOnly,
  ownerOrRole(Inventory , "sellerId" , [] , "inventoryId"),
  inventoryUpload.array("media" , 5),
  InventoryController.replaceInventoryMedia
);

router.delete(
  "/:inventoryId/media",
  protect,
  inventoryLimiter,
  kycVerifiedOnly,
  ownerOrRole(Inventory , "sellerId" , [] , "inventoryId"),
  InventoryController.removeInventoryMedia
);

export default router;
