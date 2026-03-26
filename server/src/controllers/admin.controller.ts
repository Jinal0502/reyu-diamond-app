import { Request, Response, NextFunction } from "express";
import * as AdminService from "../services/admin.service";
import * as KycService from "../services/kyc.service";
import * as AdService from "../services/advertisement.service";
import * as DealService from "../services/deal.service";
import { sendResponse } from "../utils";

export const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await AdminService.getAllUsersService(page, limit);
    return sendResponse(res, 200, true, "Users fetched successfully", result);
  } catch (error) {
    next(error);
  }
};

export const updateUserStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const user = await AdminService.updateUserStatusService(id as string, isBlocked);
    const statusMsg = isBlocked ? "User blocked successfully" : "User unblocked successfully";
    return sendResponse(res, 200, true, statusMsg, user);
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await AdminService.getAdminDashboardStatsService();
    return sendResponse(res, 200, true, "Dashboard stats fetched successfully", stats);
  } catch (error) {
    next(error);
  }
};


export const getAllAds = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ads = await AdminService.getAllAdsAdminService();
    return sendResponse(res, 200, true, "All advertisements fetched successfully", ads);
  } catch (error) {
    next(error);
  }
};

export const getAllDeals = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deals = await AdminService.getAllDealsAdminService();
    return sendResponse(res, 200, true, "All deals fetched successfully", deals);
  } catch (error) {
    next(error);
  }
};

export const getAllAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auctions = await AdminService.getAllAuctionsAdminService();
    return sendResponse(res, 200, true, "All auctions fetched successfully", auctions);
  } catch (error) {
    next(error);
  }
};
