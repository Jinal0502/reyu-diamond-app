import { Router } from "express";
import * as KycController from "../controllers/kyc.controller";
import { permit } from "../middlewares/permission.middleware";
import { kycUpload } from "../middlewares/upload.middleware";
import {validate , validateKycFiles} from "../middlewares/validation.middleware";
import { getKycsSchema, submitKycSchema, verifyKycSchema } from "../validators/kyc.validator";
import { kycLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post(
  "/submit-kyc",
  kycLimiter,
  kycUpload.fields([
    { name: "aadhaar", maxCount: 1 },
    { name: "pan", maxCount: 1 },
    { name: "selfie", maxCount: 1 },
  ]),
  validateKycFiles,
  validate(submitKycSchema),
  KycController.submitKyc
);

// router.get("/",  permit("admin"), validate(getKycsSchema) ,KycController.getKycs);

// router.put(
//   "/:id/verify-kyc",
//   permit("admin"),
//   validate(verifyKycSchema),
//   KycController.verifyKyc
// );

export default router;
