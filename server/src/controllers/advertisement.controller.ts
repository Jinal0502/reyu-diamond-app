import {Request , Response , NextFunction} from "express";
import mongoose from "mongoose";
import * as AdServices from "../services/advertisement.service";
import {sendResponse} from  "../utils/api.response";

export const requestAdController = async(
    req : Request,
    res : Response,
    next : NextFunction
) => {
    try {
        const ad = await AdServices.requestAdService({
            userId : req.user._id,
            payload : req.body,
        });

        return sendResponse(res , 201 , true , "Advertisement request submitted" , ad);
    }
    catch(error){
        next(error);
    }
};

export const getActiveAdsController = async(
    req : Request,
    res : Response,
    next : NextFunction 
) => {
    try {
        const ads = await AdServices.getActiveAdsService();

        return sendResponse(res , 200 , true , "Active Advertisements Fetched Successfully" , ads);
    }
    catch(error) { 
        next(error);
    }
}

export const approveAdController = async(
    req : Request,
    res : Response,
    next : NextFunction
) => {

    try {
        const adId = req.params.adId as string;

        if (!mongoose.Types.ObjectId.isValid(adId)) {
            return res.status(400).json({ success: false, message: "Invalid ad id" });
        }
        const updated = await AdServices.approveAdService({
            adId : new mongoose.Types.ObjectId(adId),
            adminId : req.user._id,
            payload : req.body
        });
        
        return sendResponse(res , 200 , true , "Advertisement updated successfully" , {ad : updated})

    }
    catch(error){
        next(error);
    }
}