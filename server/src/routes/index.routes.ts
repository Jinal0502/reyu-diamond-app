import {Router} from "express";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "../routes/auth.routes";
import userRoutes from "../routes/user.routes";
import kycRoutes from "../routes/kyc.routes";
import requirementRoutes  from "../routes/requirement.routes";
import inventoryRoutes from "../routes/inventory.routes";
import bidRoutes from "../routes/bid.routes";
import { protect } from "../middlewares/auth.middleware";
import {kycVerifiedOnly} from "../middlewares/kyc.middleware";


const router = Router();

router.use('/auth' , authRoutes);
router.use("/user" , protect , userRoutes);
router.use("/kyc" , protect , kycRoutes);
router.use("/requirements" , protect , requirementRoutes);
router.use("/inventory" , inventoryRoutes);
router.use("/bids" , protect , bidRoutes);

export default router;