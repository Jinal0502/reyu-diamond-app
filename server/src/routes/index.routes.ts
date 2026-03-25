import {Router} from "express";
import dotenv from "dotenv";

dotenv.config();

import authRoutes from "../routes/auth.routes";
import userRoutes from "../routes/user.routes";
import kycRoutes from "../routes/kyc.routes";
import requirementRoutes  from "../routes/requirement.routes";
import inventoryRoutes from "../routes/inventory.routes";
import bidRoutes from "../routes/bid.routes";
import dealRoutes from "../routes/deal.routes";
import dealPdfRoutes from "../routes/dealPdfRoutes";
import auctionRoutes from "../routes/auction.routes";
import stripeRoutes from "../routes/stripe.routes";
import escrowRoutes from "../routes/escrow.routes";
import chatRoutes from "../routes/chat.routes";
import ratingRoutes from "../routes/rating.routes";
import badgeRoutes from "../routes/badge.routes";
import adRoutes from "../routes/advertisement.routes";
import notificationRoutes from "../routes/notification.routes";
import { protect } from "../middlewares/auth.middleware";
import {kycVerifiedOnly} from "../middlewares/kyc.middleware";


const router = Router();

router.use('/auth' , authRoutes);
router.use("/user" , protect , userRoutes);
router.use("/kyc" , protect , kycRoutes);
router.use("/requirements" , protect , requirementRoutes);
router.use("/inventory" , inventoryRoutes);
router.use("/auctions" ,protect , kycVerifiedOnly , auctionRoutes);
router.use("/bids" , protect , kycVerifiedOnly, bidRoutes);
router.use("/deals" , protect , kycVerifiedOnly, dealRoutes);
router.use("/deals" , protect , kycVerifiedOnly, dealPdfRoutes);
router.use("/stripe", protect , kycVerifiedOnly ,stripeRoutes);
router.use("/escrow" , protect , kycVerifiedOnly , escrowRoutes);
router.use("/chats" , protect , kycVerifiedOnly , chatRoutes);
router.use("/ratings" , ratingRoutes);
router.use("/badges" , badgeRoutes);
router.use("/ads" , adRoutes);
router.use("/notifications" , notificationRoutes);

export default router;