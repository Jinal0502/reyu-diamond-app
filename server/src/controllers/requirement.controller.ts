import { Request, Response, NextFunction } from "express";
import * as RequirementService from "../services/requirement.service";
import { sendResponse } from "../utils/api.response";

const getParamId = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

// Create preference
export const createRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirement = await RequirementService.createRequirement({
      ...req.body,
      userId: req.user._id.toString(),
    });

    return sendResponse(res, 201, true, "Requirement created successfully", requirement);
  } catch (err: any) {
    next(err);
  }
};

// Get all preferences of user
export const getRequirements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirements = await RequirementService.getRequirementsByUser(req.user._id.toString());
    return sendResponse(res, 200, true, "Requirements fetched successfully", requirements);
  } catch (err: any) {
    next(err);
  }
};

// Get preference by ID
export const getRequirementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementId = getParamId(req.params.requirementId);

    const requirement = await RequirementService.getRequirementById(requirementId);

    if (!requirement) {
      return sendResponse(res, 404, false, "Requirement not found");
    }

    return sendResponse(res, 200, true, "Requirement fetched successfully", requirement);
  } catch (err: any) {
    next(err);
  }
};

// Update preference
export const updateRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementId = getParamId(req.params.requirementId);

    const updated = await RequirementService.updateRequirement(requirementId, req.body);

    return sendResponse(res, 200, true, "Requirement updated successfully", updated);
  } catch (err: any) {
    next(err);
  }
};

// Delete preference
export const deleteRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementId = getParamId(req.params.requirementId);

    await RequirementService.deleteRequirement(requirementId);

    return sendResponse(res, 200, true, "Requirement deleted successfully");
  } catch (err: any) {
    next(err);
  }
};
