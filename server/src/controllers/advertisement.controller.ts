import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import * as AdServices from "../services/advertisement.service";
import { sendResponse } from "../utils/api.response";

/* ================= REQUEST AD ================= */

export const requestAdController = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const ad = await AdServices.requestAdService({
      advertiserId: req.user._id,
      payload: req.body,
    });

    return sendResponse(
      res,
      201,
      true,
      "Advertisement request submitted",
      ad
    );
  } catch (error) {
    next(error);
  }
};

/* ================= USER ADS ================= */

export const getMyAdsController = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const ads = await AdServices.getUserAdsService(req.user._id);

    return sendResponse(res, 200, true, "User ads fetched", ads);
  } catch (error) {
    next(error);
  }
};

/* ================= ACTIVE ADS ================= */

export const getActiveAdsController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const ads = await AdServices.getActiveAdsService(
      req.query.section as string
    );

    return sendResponse(res, 200, true, "Active ads fetched", ads);
  } catch (error) {
    next(error);
  }
};

/* ================= GET AD BY ID ================= */

export const getAdByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const adId = req.params.adId as string;

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      throw new Error("Invalid ad id");
    }

    const ad = await AdServices.getAdByIdService(
      new mongoose.Types.ObjectId(adId)
    );

    return sendResponse(res, 200, true, "Ad fetched", ad);
  } catch (error) {
    next(error);
  }
};

/* ================= ADMIN UPDATE STATUS ================= */

export const updateAdStatusController = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const adId = req.params.adId as string;

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      throw new Error("Invalid ad id");
    }

    const updated = await AdServices.updateAdStatusService({
      adId: new mongoose.Types.ObjectId(adId),
      adminId: req.user._id,
      payload: req.body,
    });

    return sendResponse(
      res,
      200,
      true,
      "Advertisement updated successfully",
      updated
    );
  } catch (error) {
    next(error);
  }
};

/* ================= CLICK REDIRECT ================= */

export const clickAdController = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { adId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(adId)) {
      throw new Error("Invalid ad id");
    }

    const redirectUrl = await AdServices.clickAdService({
      adId: new mongoose.Types.ObjectId(adId),
      currentUserId: req.user?._id,
    });

    return res.redirect(302, redirectUrl);
  } catch (error) {
    next(error);
  }
};