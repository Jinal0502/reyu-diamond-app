import {Router} from "express";
import * as UserController from "../controllers/user.controller.js";

const router = Router();

router.get("/profile" , UserController.getProfile);
router.put("/profile" , UserController.updateProfile);
router.post("/fcm-token", UserController.saveFcmToken);


export default router;