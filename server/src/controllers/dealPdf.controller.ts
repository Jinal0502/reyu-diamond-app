import { Request, Response, NextFunction } from "express";
import { generateAndUploadDealPdf} from "../services/dealPdf.service";
import { sendResponse } from "../utils/api.response";

export const generateDealPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await generateAndUploadDealPdf(
      req.params.dealId as string
    );

    return sendResponse(
      res,
      200,
      true,
      "Deal PDF generated successfully",
      result
    );
  } catch (error) {
    next(error);
  }
};
