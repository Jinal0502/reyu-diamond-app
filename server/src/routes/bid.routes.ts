import { Router } from "express";
import * as BidController from "../controllers/bid.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOrRole } from "../middlewares/permission.middleware";
import { Auction } from "../models/Auction.model";
import { bidLimiter } from "../middlewares/rateLimit.middleware";

const router = Router();

// Buyer creates bid
router.post("/", bidLimiter, BidController.createBid);

// Seller/Admin updates bid status
router.patch("/:bidId/status", bidLimiter, BidController.updateBidStatus);

// Seller/Admin can see all bids in auction
router.get(
  "/auction/:auctionId",
  ownerOrRole(Auction, "sellerId", ["admin"], "auctionId"),
  BidController.getBidsByAuction
);

// Public highest bid
router.get(
  "/auction/:auctionId/highest",
  BidController.getHighestBidByAuction
);

// Buyer my bid
router.get("/my/:auctionId", BidController.getMyBid);

export default router;
