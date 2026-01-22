import { Request, Response, NextFunction } from "express";
import * as RequirementService from "../services/requirement.service";
import { sendResponse } from "../utils/api.response";

const getParamId = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

export const createRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirement = await RequirementService.createRequirement({
      ...req.body,
      userId: req.user.id,
    });

    return sendResponse(res, 201, true, "Requirement created successfully", requirement);
  } catch (err: any) {
    return sendResponse(res, 400, false, err.message || "Failed to create requirement");
  }
};

export const getActiveRequirements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirements = await RequirementService.getActiveRequirementsByUser(req.user.id);
    return sendResponse(res, 200, true, "Active requirements fetched successfully", requirements);
  } catch (err: any) {
    return sendResponse(res, 400, false, err.message || "Failed to fetch requirements");
  }
};

export const getRequirementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParamId(req.params.id);
    const requirement = await RequirementService.getRequirementById(id);

    if (!requirement) {
      return sendResponse(res, 404, false, "Requirement not found");
    }

    return sendResponse(res, 200, true, "Requirement fetched successfully", requirement);
  } catch (err: any) {
    return sendResponse(res, 400, false, err.message || "Failed to fetch requirement");
  }
};

export const updateRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParamId(req.params.id);
    const updated = await RequirementService.updateRequirement(id, req.body);
    return sendResponse(res, 200, true, "Requirement updated successfully", updated);
  } catch (err: any) {
    return sendResponse(res, 400, false, err.message || "Failed to update requirement");
  }
};

export const deleteRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = getParamId(req.params.id);
    await RequirementService.deleteRequirement(id);
    return sendResponse(res, 200, true, "Requirement deleted successfully");
  } catch (err: any) {
    return sendResponse(res, 400, false, err.message || "Failed to delete requirement");
  }
};
