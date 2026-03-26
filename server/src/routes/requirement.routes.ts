import { Router } from "express";
import * as RequirementController from "../controllers/requirement.controller";
import { ownerOrRole} from "../middlewares/permission.middleware";
import { Requirement } from "../models/Requirement.model";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware";
import { validate } from "../middlewares/validation.middleware";
import { createRequirementSchema, deleteRequirementSchema, getRequirementByIdSchema, updateRequirementSchema } from "../validators/requirement.validator";
import { requirementLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

router.get(
  "/",
  RequirementController.getRequirements
);

router.get(
  "/:requirementId",
  validate(getRequirementByIdSchema),
  ownerOrRole(Requirement , "userId" , [] , "requirementId"),
  RequirementController.getRequirementById
);
router.post(
  "/",
  requirementLimiter,
  kycVerifiedOnly,
  validate(createRequirementSchema),
  RequirementController.createRequirement
);

router.patch(
  "/:requirementId",
  requirementLimiter,
  kycVerifiedOnly,
  validate(updateRequirementSchema),
  ownerOrRole(Requirement, "userId", [] , "requirementId"),
  RequirementController.updateRequirement
);


router.delete(
  "/:requirementId",
  requirementLimiter,
  kycVerifiedOnly,
  validate(deleteRequirementSchema),
  ownerOrRole(Requirement, "userId", [] , "requirementId"), 
  RequirementController.deleteRequirement
);

export default router;
