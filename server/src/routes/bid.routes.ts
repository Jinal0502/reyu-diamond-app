import {Router} from "express";
import * as BidController from "../controllers/bid.controller";
import { ownerOrRole } from "../middlewares/permission.middleware";
import { Inventory } from "../models/Inventory.model";

const router = Router();

router.post(
  "/",
  BidController.createBid
);  

router.patch(
  "/:bidId/status",
  BidController.updateBidStatus
);

router.get(
  "/inventory/:inventoryId",
  ownerOrRole(Inventory, "sellerId" , ["admin"] , "inventoryId"),
  BidController.getBidsByInventory
);

router.get(
  "/inventory/:inventoryId/highest",
  BidController.getHighestBidByInventory
);

router.get(
  "/my/:inventoryId",
  BidController.getMyBid
);

export default router;