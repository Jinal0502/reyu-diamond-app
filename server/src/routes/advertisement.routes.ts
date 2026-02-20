import express from "express";
import {permit} from "../middlewares/permission.middleware";
import * as AdController from "../controllers/advertisement.controller";
import { protect } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/request" , protect ,AdController.requestAdController);

router.get("/" , AdController.getActiveAdsController);

router.put("/:adId/approve" , protect , permit("admin") , AdController.approveAdController);

export default router;
