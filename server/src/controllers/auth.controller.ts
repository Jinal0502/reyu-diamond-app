import { NextFunction, Request, Response } from "express";
import * as AuthService from "../services/auth.service";
import { sendResponse } from "../utils/api.response";
import { generateToken } from "../utils/generate.token";
import isEmail from "validator/lib/isEmail";

export const register = async (req: Request, res: Response , next : any) => {
  try {
    const { name, email, password } = req.body;

    const data = await AuthService.registerUser(name, email, password);

    return sendResponse(
      res,
      201,
      true,
      "Registration successful. OTP sent to email",
      data,
    );
  } catch (err: any) {
    
    next(err);
  }
};

export const verifyEmail = async(req : Request , res : Response , next : any) => {

    try {

        const {email , otp} = req.body;

        const data = await AuthService.verifyEmailOtp(email , otp);

        return sendResponse(res , 200 , true , "Email verified successfully" , data );
    }
    catch(err : any){

        next(err)
    }
}

export const resendOtp = async(req : Request , res : Response , next : any) => {

    try {

        const { email } = req.body;

        const data = await AuthService.resentEmailOtp(email);

        return sendResponse(res , 200 , true , "OTP resent to email" , data );
    }
    catch(err : any){

        next(err)
    }
}

export const login = async(req : Request , res : Response , next : any) => {

    try {

        const { email , password} = req.body;

        const user = await AuthService.loginUser(email , password);

        const token = generateToken({
            userId : user._id,
            role : user.role
        });

        return sendResponse(res , 200 , true , "Login Successful", { token , user} );
    }

    catch(err : any){
        
        next(err);

    }
}

export const forgotPassword = async(req : Request , res : Response , next : NextFunction) => {
    try {
        const { email } = req.body;

        const data = await AuthService.forgotPassword(email);

        return sendResponse(res , 200 , true , "OTP sent to email" , data );
    }
    catch(err : any){
        next(err);
    }
}

export const resetPassword = async(req : Request , res : Response , next : NextFunction) => {
    try {
        const { email , otp , newPassword} = req.body;

        const data = await AuthService.resetPasswordWithOtp(email , otp , newPassword);

        return sendResponse(res , 200 , true , "Password reset successful" , data );
    }
    catch(err : any){
        next(err);
    }
}

export const logout = async(_req: Request , res : Response) => {

    return sendResponse(
        res ,
        200,
        true,
        "Logout successfully",
    );
};
