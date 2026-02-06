import { Router } from "express";
import * as RequirementController from "../controllers/requirement.controller";
import { ownerOrRole} from "../middlewares/permission.middleware";
import { Requirement } from "../models/Requirement.model";
import { kycVerifiedOnly } from "../middlewares/kyc.middleware";

const router = Router();

router.get(
  "/",
  RequirementController.getRequirements
);

router.get(
  "/:requirementId",
  ownerOrRole(Requirement , "userId" , [] , "requirementId"),
  RequirementController.getRequirementById
);
router.post(
  "/",
  kycVerifiedOnly,
  RequirementController.createRequirement
);

router.put(
  "/:requirementId",
  kycVerifiedOnly,
  ownerOrRole(Requirement, "userId", [] , "requirementId"),
  RequirementController.updateRequirement
);


router.delete(
  "/:requirementId",
  kycVerifiedOnly,
  ownerOrRole(Requirement, "userId", [] , "requirementId"), 
  RequirementController.deleteRequirement
);

export default router;
