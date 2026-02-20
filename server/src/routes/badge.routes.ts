import express from "express";
import { protect } from "../middlewares/auth.middleware";
import {
  getUserBadgesController,
  getMyBadgesController,
} from "../controllers/badge.controller";

const router = express.Router();

router.get("/me", protect, getMyBadgesController);
router.get("/:userId", getUserBadgesController);

export default router;
