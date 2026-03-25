import { NextFunction, Request, Response } from "express";
import * as bidService from "../services/bid.service";
import { sendResponse, SuccessCode, SUCCESS_MESSAGES } from "../utils";

const param = (v: string | string[]) => (Array.isArray(v) ? v[0] : v);

export const createBid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { auctionId, bidAmount } = req.body;
    const bid = await bidService.createBidService({
      auctionId,
      buyerId: req.user!._id.toString(),
      bidAmount,
    });
    return sendResponse(res, 201, true, SUCCESS_MESSAGES[SuccessCode.BID_CREATED], bid, undefined, SuccessCode.BID_CREATED);
  } catch (error) {
    next(error);
  }
};

export const updateBidStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { action } = req.body;
    const bid = await bidService.updateBidStatusService(
      param(req.params.bidId),
      action,
      req.user!._id.toString(),
      req.user!.role
    );
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.BID_UPDATED], bid, undefined, SuccessCode.BID_UPDATED);
  } catch (error) {
    next(error);
  }
};

export const getBidsByAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bids = await bidService.getBidsByAuctionService(param(req.params.auctionId));
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.BIDS_FETCHED], bids, undefined, SuccessCode.BIDS_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getHighestBidByAuction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const highestBid = await bidService.getHighestBidByAuctionService(param(req.params.auctionId));
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.BIDS_FETCHED], highestBid, undefined, SuccessCode.BIDS_FETCHED);
  } catch (error) {
    next(error);
  }
};

export const getMyBid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const myBid = await bidService.getMyBidService(param(req.params.auctionId), req.user!._id.toString());
    return sendResponse(res, 200, true, SUCCESS_MESSAGES[SuccessCode.BIDS_FETCHED], myBid, undefined, SuccessCode.BIDS_FETCHED);
  } catch (error) {
    next(error);
  }
};
