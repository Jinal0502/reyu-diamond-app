import {Request , Response , NextFunction} from "express";
import jwt from "jsonwebtoken";
import {User} from "../models/User.model";
import { sendResponse } from "../utils/api.response";

interface JwtPayload {
    userId: string;
    role : string
}

export const protect = async(
    req : any,
    res : Response,
    next : NextFunction
) => {

    try {

        const authHeader = req.headers.authorization;

        if(!authHeader || !authHeader.startsWith("Bearer ")){

            return sendResponse(res , 200  , false , "Unauthorized")
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET as string
        ) as JwtPayload;

        const user = await User.findById(decoded.userId);

        if(!user) {

            return sendResponse(res , 401 , false , "User not found");
        }

        req.user = user;
        req.userRole = decoded.role;

        next();
    }
    catch(err) {

        return sendResponse(res , 401 , false, "Invalid or Expired Token");
    }
}