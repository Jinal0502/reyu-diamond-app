import { Request, Response, NextFunction } from "express";
import * as RequirementService from "../services/requirement.service";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES, ErrorCode } from "../utils";

const getParamId = (id: string | string[]) => (Array.isArray(id) ? id[0] : id);

export const createRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirement = await RequirementService.createRequirement({
      ...req.body,
      userId: req.user._id.toString(),
    });
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.REQUIREMENT_CREATED], requirement, undefined, SuccessCode.REQUIREMENT_CREATED);
  } catch (err: any) {
    next(err);
  }
};

export const getRequirements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirements = await RequirementService.getRequirementsByUser(req.user._id.toString());
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.REQUIREMENTS_FETCHED], requirements, undefined, SuccessCode.REQUIREMENTS_FETCHED);
  } catch (err: any) {
    next(err);
  }
};

export const getRequirementById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementId = getParamId(req.params.requirementId);
    const requirement = await RequirementService.getRequirementById(requirementId);

    if (!requirement) {
      return sendResponse(res, 404, false, "Requirement not found", null, undefined, ErrorCode.NOT_FOUND);
    }

    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.REQUIREMENT_FETCHED], requirement, undefined, SuccessCode.REQUIREMENT_FETCHED);
  } catch (err: any) {
    next(err);
  }
};

export const updateRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementId = getParamId(req.params.requirementId);
    const updated = await RequirementService.updateRequirement(requirementId, req.body);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.REQUIREMENT_UPDATED], updated, undefined, SuccessCode.REQUIREMENT_UPDATED);
  } catch (err: any) {
    next(err);
  }
};

export const deleteRequirement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const requirementId = getParamId(req.params.requirementId);
    await RequirementService.deleteRequirement(requirementId);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.REQUIREMENT_DELETED], undefined, undefined, SuccessCode.REQUIREMENT_DELETED);
  } catch (err: any) {
    next(err);
  }
};
