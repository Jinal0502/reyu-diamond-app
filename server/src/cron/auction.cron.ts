import cron from "node-cron";
import mongoose from "mongoose";
import { Auction } from "../models/Auction.model";
import { Inventory } from "../models/Inventory.model";
import { createDealService } from "../services/deal.service";
import logger from "../utils/logger";
import * as NotificationEvents from "../notifications/events";

export const initAuctionCron = () => {
  logger.info("Auction cron initialized");

  cron.schedule("*/30 * * * * *", async () => {
    const now = new Date();

    try {
      // ================================
      // 1️⃣ START UPCOMING AUCTIONS
      // ================================
      const upcomingToStart = await Auction.find({ 
        status: "upcoming", 
        startDate: { $lte: now } 
      }).populate("inventoryId", "title");

      if (upcomingToStart.length > 0) {
        const ids = upcomingToStart.map(a => a._id);
        await Auction.updateMany({ _id: { $in: ids } }, { status: "active" });
        
        logger.info("Auctions activated by cron", { count: upcomingToStart.length });

        // 🔥 Notify All Users
        for (const auction of upcomingToStart) {
          NotificationEvents.notifyAuctionStarted(
            (auction.inventoryId as any)?.title || "Diamond"
          );
        }
      }

      // ================================
      // 2️⃣ FIND AUCTIONS TO END
      // ================================
      const auctionsToEnd = await Auction.find({
        status: "active",
        endDate: { $lte: now },
      });

      if (auctionsToEnd.length > 0) {
        logger.info("Cron found auctions to end", { count: auctionsToEnd.length, auctionIds: auctionsToEnd.map(a => a._id) });
      } else {
        return;
      }

      // ================================
      // 3️⃣ PROCESS EACH AUCTION
      // ================================
      for (const auction of auctionsToEnd) {
        const session = await mongoose.startSession();

        try {
          session.startTransaction();

          const freshAuction = await Auction.findById(auction._id).session(session);

          if (!freshAuction || freshAuction.status !== "active") {
            await session.abortTransaction();
            session.endSession();
            continue;
          }

          // Mark auction as ended
          freshAuction.status = "ended";
          freshAuction.locked = true;
          freshAuction.endedAt = now;
          await freshAuction.save({ session });

          const inventory = await Inventory.findById(
            freshAuction.inventoryId
          ).session(session);

          if (!inventory) {
            await session.abortTransaction();
            session.endSession();
            continue;
          }

          // ================================
          // 4️⃣ HANDLE WINNER / NO WINNER
          // ================================
          if (freshAuction.highestBidId) {
            // Winner exists
            inventory.status = "sold";
            inventory.locked = true;
            inventory.soldAt = now;

            await inventory.save({ session });

            await createDealService(
              freshAuction.highestBidId.toString(),
              freshAuction.sellerId.toString(),
              session
            );

            logger.info("Deal created for ended auction", { auctionId: freshAuction._id });

            // 🔥 Notification to Winner
            if (freshAuction.highestBidderId && freshAuction.highestBidId) {
              NotificationEvents.notifyAuctionWon(
                freshAuction.highestBidderId.toString(),
                inventory.title || "Diamond",
                freshAuction.highestBidId.toString()
              );

              // Notify other LOST bidders
              const otherBidders = await Auction.findById(freshAuction._id)
                .select("bidIds")
                .populate({
                  path: "bidIds",
                  select: "buyerId",
                  match: { buyerId: { $ne: freshAuction.highestBidderId } }
                });
              
              if (otherBidders && (otherBidders as any).bidIds) {
                const uniqueLosingBidders = [...new Set((otherBidders as any).bidIds.map((b: any) => b.buyerId.toString()))];
                for (const bidderId of uniqueLosingBidders) {
                  NotificationEvents.notifyAuctionClosedToBidders(bidderId as any, inventory.title || "Diamond");
                }
              }
            }
          } else {
            // No bids
            inventory.status = "available";
            inventory.locked = false;

            await inventory.save({ session });

            logger.info("Auction ended without bids", { auctionId: freshAuction._id });

            // 🔥 Notification to Seller
            NotificationEvents.notifyAuctionEndedNoWinner(freshAuction.sellerId.toString(), inventory.title || "Diamond");
          }

          await session.commitTransaction();
          session.endSession();

        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          logger.error("Cron failed processing auction", { auctionId: auction._id, error });
        }
      }

    } catch (error) {
      logger.error("Auction cron global error", { error });
    }
  });
};
