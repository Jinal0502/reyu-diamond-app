import express from "express";
import * as AdController from "../controllers/advertisement.controller";
import { protect } from "../middlewares/auth.middleware";
import { permit } from "../middlewares/permission.middleware";

const router = express.Router();

/* USER */

router.post("/request", protect, AdController.requestAdController);

router.get("/my-ads", protect, AdController.getMyAdsController);

/* PUBLIC SERVING */

router.get("/", AdController.getActiveAdsController);

router.get("/:adId", protect, AdController.getAdByIdController);

router.get("/:adId/click", AdController.clickAdController);

/* ADMIN */

router.patch(
  "/:adId/status",
  protect,
  permit("admin"),
  AdController.updateAdStatusController
);

export default router;