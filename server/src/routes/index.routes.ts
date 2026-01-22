import {Router} from "express";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "../routes/auth.routes";
import userRoutes from "../routes/user.routes";
import kycRoutes from "../routes/kyc.routes";


const router = Router();

router.use('/auth' , authRoutes);
router.use("/user" , userRoutes);
router.use("/kyc" , kycRoutes);

export default router;