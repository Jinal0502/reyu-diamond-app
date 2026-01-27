import { Router } from "express";
import * as RequirementController from "../controllers/requirement.controller";
import { ownerOrRole} from "../middlewares/permission.middleware";
import { Requirement } from "../models/Requirement.model";

const router = Router();

router.get(
  "/",
  RequirementController.getRequirements
);

router.get(
  "/:id",
  ownerOrRole(Requirement),
  RequirementController.getRequirementById
);
router.post(
  "/",
  RequirementController.createRequirement
);

router.put(
  "/:id",
  ownerOrRole(Requirement, "userId", ["admin"]),
  RequirementController.updateRequirement
);


router.delete(
  "/:id",
  ownerOrRole(Requirement, "userId", ["admin"]), 
  
  RequirementController.deleteRequirement
);

export default router;
