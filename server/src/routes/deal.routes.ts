import { Router } from "express";
import * as DealController from "../controllers/deal.controller";
import { protect } from "../middlewares/auth.middleware";
import { canAccessDeal } from "../middlewares/canAccessDeal.middleware";

const router = Router();

router.get("/", protect, DealController.listDeals);

router.get("/:dealId", protect, canAccessDeal, DealController.getDeal);

router.put(
  "/:dealId/status",
  protect,
  canAccessDeal,
  DealController.updateDealStatus
);

export default router;
