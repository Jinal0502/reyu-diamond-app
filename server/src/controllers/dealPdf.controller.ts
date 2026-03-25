import { Request, Response, NextFunction } from "express";
import { generateAndUploadDealPdf } from "../services/dealPdf.service";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";

export const generateDealPdf = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await generateAndUploadDealPdf(req.params.dealId);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.DEAL_PDF_GENERATED], result, undefined, SuccessCode.DEAL_PDF_GENERATED);
  } catch (error) {
    next(error);
  }
};
