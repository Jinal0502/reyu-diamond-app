import mongoose , {Schema , Document , Types} from "mongoose";
import { maxLength } from "zod";

export type AdPlacement = "HOME_BANNER" | "SEARCH_SIDEBAR" | "LISTING_TOP" | "FOOTER";

export type AdStatus = "PENDING" | "APPROVED" | "REJECTED" | "EXPIRED";

export interface IAdvertisement extends Document {

    userId : Types.ObjectId,

    title : string;
    description : string;
    imageUrl : string;

    linkUrl?: string;

    duration : number;
    placement : AdPlacement;

    status : AdStatus;

    estimatedCost : number;
    priority : number;

    startDate? : Date;
    endDate?: Date;

    impressions: number;
    clicks : number;

    approvedBy?: Types.ObjectId;
    approvedAt?: Date;

    rejectedBy?: Types.ObjectId;
    rejectedAt?: Date;
    rejectionReason?: string;

    submittedAt : Date;

    createdAt : Date;
    updatedAt : Date;
}

const AdvertisementSchema = new Schema<IAdvertisement>(
    {
        userId : {
            type : Schema.Types.ObjectId,
            ref : "User",
            required : true,
            index : true,
        },
        title : {
            type : String,
            required : true,
            minLength : 5,
            maxLength : 100,
            trim : true
        },
        description : {
            type : String,
            required : true,
            minLength : 10,
            maxLength : 500,
            trim : true
        },

        imageUrl : { type : String , required : true},

        linkUrl : {
            type : String,
            trim : true,
            validate : {
                validator : function(v : string) {
                    return !v || /^https?:\/\/.+/.test(v);
                },
                message : "Invalid URL format"
            },
        },

        duration : {
            type : Number,
            required : true,
            min : 7,
            max : 90
        },

        placement : {
            type : String,
            enum : ["HOME_BANNER" , "SERACH_SIDEBAR" , "LISTING_TOP" , "FOOTER"],
            required : true,
            index : true,
        },
        status : {
            type : String,
            enum : ["PENDING" , "APPROVED" , "REJECTED" , "EXPIRED"],
            default : "PENDING",
            index : true,
        },

        estimatedCost : {
            type : Number,
            required : true,
            min : 0,
        },

        priority : {
            type : Number,
            min : 1,
            max : 10,
            default : 5,
        },
        startDate : {
            type : Date,
            default : null,
        },
        endDate : {
            type : Date,
            default : null,
        },
        impressions : {
            type : Number,
            default : 0,
            min : 0,
        },
        clicks : {
            type : Number,
            default : 0,
            min : 0,
        },
        approvedBy : {
            type : Schema.Types.ObjectId,
            ref : "User",
            default : null
        },
        approvedAt : {
            type : Date,
            default : null,
        },
        rejectedBy : {
            type : Schema.Types.ObjectId,
            ref : "User",
            default : null
        },
        rejectedAt : {
            type : Date,
            default : null,
        },
        rejectionReason : {
            type : String,
            maxLength : 500,
            trim : true
        },
        submittedAt : {
            type : Date,
            default : Date.now,
        },
    },
    {timestamps : true}
);

AdvertisementSchema.index({ status: 1, startDate: 1 });
AdvertisementSchema.index({ userId: 1, status: 1 });
AdvertisementSchema.index({ placement: 1, status: 1 });
AdvertisementSchema.index({ priority: -1, startDate: -1 });

export const Advertisement = mongoose.model<IAdvertisement>(
  "Advertisement",
  AdvertisementSchema
);
