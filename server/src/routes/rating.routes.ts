import express from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  createRatingController,
  getRatingsController,
  getMyRatingsController
} from "../controllers/rating.controller";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware";

const router = express.Router();


router.get("/me", protect, getMyRatingsController);

router.post("/:userId", protect , kycVerifiedOnly, createRatingController);
router.get("/:userId",  getRatingsController);


export default router;
