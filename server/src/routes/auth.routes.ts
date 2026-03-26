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
import { authLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

router.post("/register" , authLimiter, validate(registerSchema) ,  AuthController.register);
router.post("/verify-email" , authLimiter, validate(verifyEmailSchema) , AuthController.verifyEmail);
router.post("/resend-otp" ,  authLimiter ,validate(resendOtpSchema) , AuthController.resendOtp);
router.post("/login" , authLimiter ,validate(loginSchema) , AuthController.login);

router.post("/forgot-password" , authLimiter, validate(forgotPasswordSchema) , AuthController.forgotPassword);
router.post("/reset-password" , authLimiter, validate(resetPasswordSchema) , AuthController.resetPassword);
router.post("/logout" , protect , AuthController.logout);

export default router;