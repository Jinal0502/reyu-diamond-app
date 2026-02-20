import {Types} from "mongoose";
import { Advertisement } from "../models/Advertisement.model";
import { CustomError } from "../utils/customError.utility";

interface RequestAdInput {
    userId : Types.ObjectId;
    payload : any;
}

export const requestAdService = async({userId , payload} : RequestAdInput) => {

    const {title , description , imageUrl , linkUrl , duration , placement} = payload;

    if(!title || !description || !imageUrl || !duration || !placement){
        throw new CustomError("All required fields must be provided" , 400);
    }

    const baseRate = 1000;
    const placementMultiplier: Record<string, number> = {
        HOME_BANNER: 3,
        SEARCH_SIDEBAR: 2,
        LISTING_TOP: 2.5,
        FOOTER: 1,
    };

    const multiplier = placementMultiplier[placement] || 1;
    const estimatedCost = baseRate * multiplier * duration;

    const ad = await Advertisement.create({
        userId,
        title,
        description,
        imageUrl,
        linkUrl,
        duration,
        placement,
        estimatedCost,
        status : "PENDING",
        priority : 5,
        submittedAt : new Date(),
    });

    return ad;
}

export const getActiveAdsService = async() => {

    const now = new Date();

    const ads = await Advertisement.find({
        status : "APPROVED",
        startDate : {$lte : now},
        endDate : {$gte : now},
    })
      .sort({priority : -1 , createdAt : -1})
      .select("-imageUrl");
    
    return ads;
};

interface ApproveAdInput {
    adId : Types.ObjectId;
    adminId : Types.ObjectId;
    payload : any;
}

export const approveAdService = async({adId , adminId , payload} : ApproveAdInput) => {

    const {action , rejectionReason , priority} = payload;

    const ad = await Advertisement.findById(adId);
    if(!ad) throw new CustomError("Advertisement not found" , 404);

    if (ad.status !== "PENDING") {
        throw new Error("Only PENDING ads can be approved/rejected");
    }

    if (!action || !["APPROVE", "REJECT"].includes(action)) {
        throw new Error("action must be APPROVE or REJECT");
    }

    if (action === "REJECT" && !rejectionReason) {
        throw new Error("rejectionReason is required for rejection");
    }

    if (action === "APPROVE") {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + ad.duration);

        ad.status = "APPROVED";
        ad.approvedBy = adminId;
        ad.approvedAt = new Date();
        ad.startDate = startDate;
        ad.endDate = endDate;

        if (priority) ad.priority = priority;
    }

    if (action === "REJECT") {
        ad.status = "REJECTED";
        ad.rejectedBy = adminId;
        ad.rejectedAt = new Date();
        ad.rejectionReason = rejectionReason;
    }

    await ad.save();

    return ad;

}