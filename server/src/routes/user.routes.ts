import {Router} from "express";
import * as UserController from "../controllers/user.controller.js";
import { userLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

router.get("/profile" , UserController.getProfile);
router.put("/profile" , userLimiter, UserController.updateProfile);
router.post("/fcm-token", userLimiter, UserController.saveFcmToken);


export default router;