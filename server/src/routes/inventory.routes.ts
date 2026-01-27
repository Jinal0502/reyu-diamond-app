import { Router } from "express";
import * as InventoryController from "../controllers/inventory.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOrRole} from "../middlewares/permission.middleware";
import { Inventory } from "../models/Inventory.model";

const router = Router();

router.get(
  "/",
  InventoryController.getInventory
);

router.get(
  "/:id",
  InventoryController.getInventoryItem
);

router.post(
  "/",
  protect,
  InventoryController.createInventoryItem
);

router.put(
  "/:id",
  protect,
  ownerOrRole(Inventory , "sellerId" , ["admin"]),
  InventoryController.updateInventoryItem
);

router.delete(
  "/:id",
  protect,
  ownerOrRole(Inventory , "sellerId" , ["admin"]),
  InventoryController.deleteInventoryItem
);

export default router;
