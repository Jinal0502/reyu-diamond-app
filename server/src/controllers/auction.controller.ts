import { Request, Response, NextFunction } from "express";
import * as AuctionService from "../services/auction.service";
import { sendResponse } from "../utils/api.response";

export const createAuction = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { inventoryId, basePrice, startDate, endDate } = req.body;
    const userId = req.user._id;

    const auction = await AuctionService.createAuctionService({
      inventoryId,
      basePrice,
      startDate,
      endDate,
      userId,
    });

    return sendResponse(res, 201, true, "Auction created successfully", auction);
  } catch (error) {
    next(error);
  }
};

export const getAuctions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: any = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.sellerId) filters.sellerId = req.query.sellerId;
    if (req.query.inventoryId) filters.inventoryId = req.query.inventoryId;

    const auctions = await AuctionService.getAuctionsService(filters);

    return sendResponse(res, 200, true, "Auctions fetched successfully", auctions);
  } catch (error) {
    next(error);
  }
};

export const getMyAuctions = async (req: any, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;

    const auctions = await AuctionService.getAuctionsService({
      sellerId: userId,
    });

    return sendResponse(res, 200, true, "My auctions fetched successfully", auctions);
  } catch (error) {
    next(error);
  }
};

export const getAuctionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auctionId = req.params.auctionId as string;
    const auction = await AuctionService.getAuctionByIdService(auctionId);

    return sendResponse(res, 200, true, "Auction fetched successfully", auction);
  } catch (error) {
    next(error);
  }
};



export const updateAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auctionId = req.params.auctionId as string;

    const updatedAuction = await AuctionService.updateAuctionService(auctionId, {
      basePrice: req.body.basePrice,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    });

    return sendResponse(res, 200, true, "Auction updated successfully", updatedAuction);
  } catch (error) {
    next(error);
  }
};

export const deleteAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auctionId = req.params.auctionId as string;

    await AuctionService.deleteAuctionService(auctionId);

    return sendResponse(res, 200, true, "Auction deleted successfully", null);
  } catch (error) {
    next(error);
  }
};

