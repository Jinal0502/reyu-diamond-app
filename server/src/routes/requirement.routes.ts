import { Router } from "express";
import * as RequirementController from "../controllers/requirement.controller";
import { protect } from "../middlewares/auth.middleware";
import { permit } from "../middlewares/permission.middleware";

const router = Router();

const getParamId = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

router.post(
  "/",
  protect,
  RequirementController.createRequirement
);

router.get(
  "/",
  protect,
  RequirementController.getActiveRequirements
);

router.get(
  "/:id",
  protect,
  RequirementController.getRequirementById
);

router.put(
  "/:id",
  protect,
  permit("admin").ownerOrRole(req => getParamId(req.params.id)), 
  RequirementController.updateRequirement
);


router.delete(
  "/:id",
  protect,
  permit("admin").ownerOrRole(req => getParamId(req.params.id)), 
  RequirementController.deleteRequirement
);

export default router;
