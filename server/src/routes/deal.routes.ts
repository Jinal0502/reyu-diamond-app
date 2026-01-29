import { Router } from "express";
import * as DealController from "../controllers/deal.controller";
import { ownerOrRole } from "../middlewares/permission.middleware";
import { Deal } from "../models/Deal.model";
import { canAccessDeal } from "../middlewares/canAccessDeal.middleware";

const router = Router();

router.post("/:bidId", DealController.createDeal );

router.get( "/:dealId", canAccessDeal , DealController.getDeal);

router.get( "/",  DealController.listDeals);

router.put( "/:dealId/status", canAccessDeal, DealController.updateDealStatus);

export default router;

