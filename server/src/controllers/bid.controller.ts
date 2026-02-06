import { NextFunction, Request, Response } from "express";
import * as bidService from "../services/bid.service";
import { sendResponse } from "../utils/api.response";

export const createBid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { auctionId, bidAmount } = req.body;
    const buyerId = req.user!._id.toString();

    const bid = await bidService.createBidService({
      auctionId,
      buyerId,
      bidAmount,
    });

    return sendResponse(res, 201, true, "Bid created successfully", bid);
  } catch (error) {
    next(error);
  }
};

export const updateBidStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const bidId = req.params.bidId as string;
    const { action } = req.body;

    const userId = req.user!._id.toString();
    const userRole = req.user!.role;

    const bid = await bidService.updateBidStatusService(
      bidId,
      action,
      userId,
      userRole
    );

    return sendResponse(
      res,
      200,
      true,
      `Bid ${action.toLowerCase()}ed successfully`,
      bid
    );
  } catch (error) {
    next(error);
  }
};

export const getBidsByAuction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auctionId = req.params.auctionId as string;

    const bids = await bidService.getBidsByAuctionService(auctionId);

    return sendResponse(res, 200, true, "Bids fetched successfully", bids);
  } catch (error) {
    next(error);
  }
};

export const getHighestBidByAuction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auctionId = req.params.auctionId as string;

    const highestBid = await bidService.getHighestBidByAuctionService(auctionId);

    return sendResponse(res, 200, true, "Highest bid fetched", highestBid);
  } catch (error) {
    next(error);
  }
};

export const getMyBid = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const auctionId = req.params.auctionId as string;
    const buyerId = req.user!._id.toString();

    const myBid = await bidService.getMyBidService(auctionId, buyerId);

    return sendResponse(res, 200, true, "My bid fetched", myBid);
  } catch (error) {
    next(error);
  }
};
