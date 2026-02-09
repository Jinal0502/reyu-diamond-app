import {Router} from "express";
import * as AuthController from "../controllers/auth.controller";
import {protect} from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validation.middleware"
import {
  registerSchema,
  verifyEmailSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,    
} from "../validators/auth.validator"

const router = Router();

router.post("/register" , validate(registerSchema) ,  AuthController.register);
router.post("/verify-email" , validate(verifyEmailSchema) , AuthController.verifyEmail);
router.post("/resend-otp" ,  validate(resendOtpSchema) , AuthController.resendOtp);
router.post("/login" , validate(loginSchema) , AuthController.login);

router.post("/forgot-password" , validate(forgotPasswordSchema) , AuthController.forgotPassword);
router.post("/reset-password" , validate(resetPasswordSchema) , AuthController.resetPassword);
router.post("/logout" , protect , AuthController.logout);

export default router;