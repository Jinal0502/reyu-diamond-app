import { Router } from "express";
import * as AdminController from "../controllers/admin.controller";
import * as KycController from "../controllers/kyc.controller";
import * as AdsController from "../controllers/advertisement.controller";
import * as DealController from "../controllers/deal.controller";
import { protect } from "../middlewares/auth.middleware";
import { permit } from "../middlewares/permission.middleware";

const router = Router();

// Dashboard Stats
router.get("/stats", AdminController.getDashboardStats);

// User Management
router.get("/users", AdminController.getAllUsers);
router.patch("/users/:id/block", AdminController.updateUserStatus);

// KYC Management
router.get("/kyc", permit("admin"), KycController.getKycs);
router.put("/kyc/:id/verify-kyc", KycController.verifyKyc);

// Advertisement Management
router.get("/ads", AdminController.getAllAds);
router.patch("/ads/:adId/status", AdsController.updateAdStatusController);

// Deal & Dispute Management
router.get("/deals", AdminController.getAllDeals);
router.patch("/deals/:id/resolve-dispute", DealController.resolveDispute);

// Auction Management
router.get("/auctions", AdminController.getAllAuctions);

export default router;
