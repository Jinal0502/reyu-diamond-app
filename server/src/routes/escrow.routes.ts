import express from "express";
import { protect } from "../middlewares/auth.middleware";
import { createPaymentIntentForDeal , releaseEscrow } from "../controllers/escrow.controller";

const router = express.Router();

router.post("/create-payment", createPaymentIntentForDeal);
router.post("/:dealId/release",  releaseEscrow);

export default router;
