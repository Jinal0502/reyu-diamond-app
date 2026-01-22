import {Request , Response , NextFunction } from "express";
import { sendResponse } from "../utils/api.response";

export const errorHandler = (
    err : any,
    _req : Request,
    res : Response,
    _next : NextFunction
) => {
    console.log(err);

    return sendResponse(res , err.statusCode || 500 , false , err.message || "Internal Server Error");
}