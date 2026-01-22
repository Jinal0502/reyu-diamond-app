import { Router } from "express";
import * as KycController from "../controllers/kyc.controller";
import { protect } from "../middlewares/auth.middleware";
import { permit } from "../middlewares/permission.middleware";
import { kycUpload } from "../middlewares/upload.middleware";

const router = Router();

router.post(
  "/submit-kyc",
  protect,
  kycUpload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  KycController.submitKyc
);

router.get("/", protect, permit("admin"), KycController.getKycs);
router.put("/:id/approve", protect, permit("admin"), KycController.approveKyc);
router.put("/:id/reject", protect, permit("admin"), KycController.rejectKyc);

export default router;
