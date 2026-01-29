import { Router } from "express";
import * as InventoryController from "../controllers/inventory.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOrRole} from "../middlewares/permission.middleware";
import { Inventory } from "../models/Inventory.model";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware";

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
  kycVerifiedOnly,
  InventoryController.createInventoryItem
);

router.put(
  "/:inventoryId",
  protect,
  kycVerifiedOnly,
  ownerOrRole(Inventory , "sellerId" , ["admin"] , "inventoryId"),
  InventoryController.updateInventoryItem
);

router.delete(
  "/:inventoryId",
  protect,
  kycVerifiedOnly,
  ownerOrRole(Inventory , "sellerId" , ["admin"] , "inventoryId"),
  InventoryController.deleteInventoryItem
);

export default router;
