import { NextFunction, Request , Response } from "express";
import * as bidService from "../services/bid.service";
import { sendResponse } from "../utils/api.response";

export const createBid= async (req: Request, res: Response , next : NextFunction) => {
    try {
        const { inventoryId, bidAmount } = req.body;

        const buyerId = req.user!._id.toString();

        const bid = await bidService.createBidService({ inventoryId, buyerId, bidAmount });

        return sendResponse(res, 201, true,"Bid created successfully", bid);    
    }
    catch (error: any) {
        next(error);
    }
}

export const updateBidStatus = async (req: Request, res: Response , next : NextFunction) => {
    try {
        const bidId = Array.isArray(req.params.bidId) ? req.params.bidId[0] : req.params.bidId;
        const { action } = req.body;

        const userId = req.user!._id.toString();
        const userRole = req.user!.role;

        const bid = await bidService.updateBidStatusService(bidId, action, userId, userRole);

        return sendResponse(res, 200, true,`Bid ${action.toLowerCase()}ed successfully`, bid);    
    }
    catch (error: any) {
        next(error);
    }
}

export const getBidsByInventory = async (req: Request, res: Response , next : NextFunction) => {
    try {
        const inventoryId = Array.isArray(req.params.inventoryId) ? req.params.inventoryId[0] : req.params.inventoryId;

        const bids = await bidService.getBidsByInventoryService(inventoryId);
        return sendResponse(res, 200, true,"Bids fetched successfully", bids);    
    }   
    catch (error: any) {
        next(error);
    }   
}

export const getHighestBidByInventory = async (req: Request, res: Response , next : NextFunction) => {
    try {
        const inventoryId = Array.isArray(req.params.inventoryId) ? req.params.inventoryId[0] : req.params.inventoryId;

        const buyerId = req.user!._id.toString();

        const highestBid = await bidService.getMyBidService(inventoryId, buyerId);
        return sendResponse(res, 200, true,"Highest bid fetched successfully", highestBid);    
    }   
    catch (error: any) {
        next(error);
    }   
}

export const getMyBid = async (req: Request, res: Response , next : NextFunction) => {
    try {
        const inventoryId = Array.isArray(req.params.inventoryId) ? req.params.inventoryId[0] : req.params.inventoryId;
        const buyerId = req.user!._id.toString();

        const myBid = await bidService.getMyBidService(inventoryId, buyerId);
        return sendResponse(res, 200, true,"My bid fetched successfully", myBid);    
    }   
    catch (error: any) {
        next(error);
    }
}