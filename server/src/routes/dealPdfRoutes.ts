import { Router } from "express";
import * as DealPdfController from "../controllers/dealPdf.controller";
import { ownerOrRole } from "../middlewares/permission.middleware";
import { Deal } from "../models/Deal.model";
import { canAccessDeal } from "../middlewares/canAccessDeal.middleware";

const router = Router();

router.post(
  "/:dealId/pdf",
  canAccessDeal,
  DealPdfController.generateDealPdf
);

export default router;
