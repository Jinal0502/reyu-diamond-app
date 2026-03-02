import cron from "node-cron";
import mongoose from "mongoose";
import { Auction } from "../models/Auction.model";
import { Inventory } from "../models/Inventory.model";
import { createDealService } from "../services/deal.service";

export const initAuctionCron = () => {
  console.log("Auction cron initialized");

  cron.schedule("*/30 * * * * *", async () => {
    console.log("Auction cron tick:", new Date());

    const now = new Date();

    try {
      // ================================
      // 1️⃣ START UPCOMING AUCTIONS
      // ================================
      const started = await Auction.updateMany(
        { status: "upcoming", startDate: { $lte: now } },
        { status: "active" }
      );

      if (started.modifiedCount > 0) {
        console.log("Auctions activated:", started.modifiedCount);
      }

      // ================================
      // 2️⃣ FIND AUCTIONS TO END
      // ================================
      const auctionsToEnd = await Auction.find({
        status: "active",
        endDate: { $lte: now },
      });

      if (auctionsToEnd.length === 0) return;

      console.log("Auctions to end:", auctionsToEnd.length);

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

            // Save inventory FIRST
            await inventory.save({ session });

            // THEN create deal
            await createDealService(
              freshAuction.highestBidId.toString(),
              freshAuction.sellerId.toString(),
              session
            );

            console.log("Deal created for auction:", freshAuction._id);

          } else {
            // No bids
            inventory.status = "available";
            inventory.locked = false;

            await inventory.save({ session });

            console.log("Auction ended without bids:", freshAuction._id);
          }

          await session.commitTransaction();
          session.endSession();

        } catch (error) {
          await session.abortTransaction();
          session.endSession();
          console.error("Cron auction error:", error);
        }
      }

    } catch (error) {
      console.error("Auction cron global error:", error);
    }
  });
};