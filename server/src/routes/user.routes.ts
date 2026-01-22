import {Router} from "express";
import * as UserController from "../controllers/user.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/profile" , protect , UserController.getProfile);
router.put("/profile" , protect , UserController.updateProfile);

export default router;