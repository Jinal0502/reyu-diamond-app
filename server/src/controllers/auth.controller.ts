import { Request, Response } from "express";
import * as AuthService from "../services/auth.service";
import { sendResponse } from "../utils/api.response";
import { generateToken } from "../utils/generate.token";

export const register = async (req: Request, res: Response) => {
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
    if (err.message === "USER_ALREADY_EXISTS") {
      return sendResponse(
        res,
        409,
        false,
        "User already exists",
      );
    }

    return sendResponse(
      res,
      500,
      false,
      "Internal server error",
      err.message
    );
  }
};

export const verifyEmail = async(req : Request , res : Response) => {

    try {

        const {email , otp} = req.body;
        console.log(email , otp);
        const data = await AuthService.verifyEmailOtp(email , otp);

        return sendResponse(res , 200 , true , "Email verified successfully" , data );
    }
    catch(err : any){

        return sendResponse(res , 400 , false , err.message || "OTP verification failed"  );
    }
}

export const login = async(req : Request , res : Response) => {

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
        
        return sendResponse(res , 401 , false , err.message || "Invalid credentials"  );

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
