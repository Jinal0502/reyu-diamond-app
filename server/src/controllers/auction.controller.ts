import { Request, Response, NextFunction } from "express";
import * as AuctionService from "../services/auction.service";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";

export const createAuction = async (req: any, res: Response, next: NextFunction) => {
  try {
    const { inventoryId, basePrice, startDate, endDate } = req.body;
    const auction = await AuctionService.createAuctionService({
      inventoryId, basePrice, startDate, endDate, userId: req.user._id,
    });
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.AUCTION_CREATED], auction, undefined, SuccessCode.AUCTION_CREATED);
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
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.AUCTIONS_FETCHED], auctions, undefined, SuccessCode.AUCTIONS_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getMyAuctions = async (req: any, res: Response, next: NextFunction) => {
  try {
    const auctions = await AuctionService.getAuctionsService({ sellerId: req.user._id });
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.AUCTIONS_FETCHED], auctions, undefined, SuccessCode.AUCTIONS_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getAuctionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const auction = await AuctionService.getAuctionByIdService(req.params.auctionId as string);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.AUCTION_FETCHED], auction, undefined, SuccessCode.AUCTION_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const updateAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updatedAuction = await AuctionService.updateAuctionService(req.params.auctionId as string, {
      basePrice: req.body.basePrice,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
    });
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.AUCTION_UPDATED], updatedAuction, undefined, SuccessCode.AUCTION_UPDATED);
  } catch (error) {
    next(error);
  }
};

export const deleteAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await AuctionService.deleteAuctionService(req.params.auctionId as string);
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.AUCTION_DELETED], null, undefined, SuccessCode.AUCTION_DELETED);
  } catch (error) {
    next(error);
  }
};
