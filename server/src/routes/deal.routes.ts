import { Router } from "express";
import * as DealController from "../controllers/deal.controller";
import { canAccessDeal } from "../middlewares/canAccessDeal.middleware";

const router = Router();

router.get("/",  DealController.listDeals);

router.get("/:dealId",  canAccessDeal, DealController.getDeal);


router.patch("/:dealId/ship", canAccessDeal, DealController.markShipped);
router.patch("/:dealId/deliver", canAccessDeal, DealController.confirmDelivered);
router.patch("/:dealId/cancel", canAccessDeal, DealController.cancelDeal);
router.patch("/:dealId/dispute", canAccessDeal, DealController.raiseDispute);
router.patch("/:dealId/resolve-dispute" , canAccessDeal , DealController.resolveDispute);


export default router;
