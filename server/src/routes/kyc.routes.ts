import { Router } from "express";
import * as KycController from "../controllers/kyc.controller";
import { permit } from "../middlewares/permission.middleware";
import { kycUpload } from "../middlewares/upload.middleware";

const router = Router();

router.post(
  "/submit-kyc",
  kycUpload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  KycController.submitKyc
);

router.get("/",  permit("admin"), KycController.getKycs);

router.put(
  "/:id/verify-kyc",
  permit("admin"),
  KycController.verifyKyc
);

export default router;
