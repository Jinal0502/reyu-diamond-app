import express from "express";
import { createConnectedAccount , createOnboardingLink , checkStripeAccountStatusController } from "../controllers/stripe.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/create-connected-account",  createConnectedAccount);
router.post("/create-onboarding-link",  createOnboardingLink);
router.get("/account-status",  checkStripeAccountStatusController);


export default router;
