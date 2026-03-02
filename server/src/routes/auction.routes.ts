import express from "express";
import * as AuctionController from "../controllers/auction.controller";
import { protect } from "../middlewares/auth.middleware";
import { ownerOrRole } from "../middlewares/permission.middleware";
import { Auction } from "../models/Auction.model";

const router = express.Router();

// PUBLIC
router.get("/", AuctionController.getAuctions);
router.get("/my-auctions",  AuctionController.getMyAuctions);
router.get("/:auctionId", AuctionController.getAuctionById);

// PROTECTED
router.post("/", protect, AuctionController.createAuction);

router.put(
  "/:auctionId",
  protect,
  ownerOrRole(Auction, "sellerId", [], "auctionId"),
  AuctionController.updateAuction
);

router.delete(
  "/:auctionId",
  protect,
  ownerOrRole(Auction, "sellerId", [], "auctionId"),
  AuctionController.deleteAuction
);

export default router;
