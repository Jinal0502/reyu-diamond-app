import { Router } from "express";
import * as RequirementController from "../controllers/requirement.controller";
import { ownerOrRole} from "../middlewares/permission.middleware";
import { Requirement } from "../models/Requirement.model";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware";
import { validate } from "../middlewares/validation.middleware";
import { createRequirementSchema, deleteRequirementSchema, getRequirementByIdSchema, updateRequirementSchema } from "../validators/requirement.validator";

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
  kycVerifiedOnly,
  validate(createRequirementSchema),
  RequirementController.createRequirement
);

router.patch(
  "/:requirementId",
  kycVerifiedOnly,
  validate(updateRequirementSchema),
  ownerOrRole(Requirement, "userId", [] , "requirementId"),
  RequirementController.updateRequirement
);


router.delete(
  "/:requirementId",
  kycVerifiedOnly,
  validate(deleteRequirementSchema),
  ownerOrRole(Requirement, "userId", [] , "requirementId"), 
  RequirementController.deleteRequirement
);

export default router;
