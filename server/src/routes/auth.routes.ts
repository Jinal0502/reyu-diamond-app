import {Router} from "express";
import * as AuthController from "../controllers/auth.controller";
import {protect} from "../middlewares/auth.middleware";

const router = Router();

router.post("/register" , AuthController.register);
router.post("/verify-email" , AuthController.verifyEmail);
router.post("/login" , AuthController.login);
router.post("/logout" , protect , AuthController.logout);

export default router;