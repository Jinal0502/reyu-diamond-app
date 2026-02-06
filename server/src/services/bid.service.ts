import mongoose from "mongoose";
import { Auction } from "../models/Auction.model";
import { Inventory } from "../models/Inventory.model";
import { Bid } from "../models/Bid.model";
import { createDealService } from "./deal.service";

export type BidAction = "ACCEPT" | "REJECT" | "EXPIRE";

interface CreateBidInput {
  auctionId: string;
  buyerId: string;
  bidAmount: number;
}

export const createBidService = async ({
  auctionId,
  buyerId,
  bidAmount,
}: CreateBidInput) => {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Fetch auction
      const auction = await Auction.findById(auctionId).session(session);
      if (!auction) throw new Error("Auction not found");

      // 2. Validate auction status
      if (auction.status !== "active") throw new Error("Auction is not active");
      const now = new Date();
      if (now < new Date(auction.startDate)) throw new Error("Auction not started");
      if (now > new Date(auction.endDate)) throw new Error("Auction has ended");

      // 3. Prevent seller from bidding
      if (auction.sellerId.toString() === buyerId.toString())
        throw new Error("You cannot bid on your own auction");

      // 4. Prevent self-outbidding
      if (auction.highestBidderId?.toString() === buyerId.toString())
        throw new Error("You already have the highest bid");

      // 5. Check bid amount
      const currentPrice = auction.currentBid ?? auction.basePrice;
      if (bidAmount <= currentPrice)
        throw new Error(`Bid must be higher than ${currentPrice}`);

      // 6. Create bid initially as isHighestBid = false to avoid unique index conflict
      const [bid] = await Bid.create(
        [
          {
            auctionId,
            buyerId,
            bidAmount,
            status: "ACTIVE",
            isHighestBid: false, // temporarily false
          },
        ],
        { session }
      );

      if (!bid) throw new Error("Failed to create bid");

      // 7. Atomic auction update
      const updatedAuction = await Auction.findOneAndUpdate(
        {
          _id: auction._id,
          currentBid: currentPrice, // ensures no race condition
        },
        {
          $set: {
            currentBid: bidAmount,
            highestBidId: bid._id,
            highestBidderId: buyerId,
          },
          $push: { bidIds: bid._id },
        },
        { new: true, session }
      );

      if (!updatedAuction) {
        // Conflict happened, retry
        await session.abortTransaction();
        session.endSession();
        attempt++;
        continue; // retry automatically
      }

      // 8. Demote previous highest bids (mark as REJECTED)
      await Bid.updateMany(
        {
          auctionId,
          _id: { $ne: bid._id },
          isHighestBid: true,
          status: "ACTIVE",
        },
        { $set: { isHighestBid: false, status: "REJECTED" } },
        { session }
      );

      // 9. Promote current bid as highest
      await Bid.findByIdAndUpdate(
        bid._id,
        { isHighestBid: true },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      return bid;
    } catch (error: any) {
      await session.abortTransaction();
      session.endSession();

      // Handle unique index or conflict errors
      if (
        error.message.includes("Bid conflict") ||
        error.message.includes("Duplicate value")
      ) {
        attempt++;
        continue; // retry automatically
      }

      throw error;
    }
  }

  // After retries
  throw new Error(
    "Bid conflict persisted. Please check the latest bid and try again."
  );
};

export const updateBidStatusService = async (
  bidId: string,
  action: BidAction,
  userId: string,
  userRole: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bid = await Bid.findById(bidId).session(session);
    if (!bid) throw new Error("Bid not found");

    if (bid.status !== "ACTIVE") {
      throw new Error("Only active bids can be updated");
    }

    const auction = await Auction.findById(bid.auctionId).session(session);
    if (!auction) throw new Error("Auction not found");

    const isOwner = auction.sellerId.toString() === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      throw new Error("Access denied");
    }

    let deal: any = null; // store created deal

    switch (action) {
      case "ACCEPT": {
        if (auction.status !== "active") {
          throw new Error("Auction is not active");
        }

        // Reject all other active bids
        await Bid.updateMany(
          {
            auctionId: auction._id,
            _id: { $ne: bid._id },
            status: "ACTIVE",
          },
          { $set: { status: "REJECTED", isHighestBid: false } },
          { session }
        );

        // Accept selected bid
        bid.status = "ACCEPTED";
        bid.isHighestBid = false;
        await bid.save({ session });

        // End auction
        auction.status = "ended";
        auction.locked = true;
        auction.endedAt = new Date();
        auction.highestBidId = bid._id;
        auction.highestBidderId = bid.buyerId;
        auction.currentBid = bid.bidAmount;
        await auction.save({ session });

        // Update inventory
        const inventory = await Inventory.findById(auction.inventoryId).session(
          session
        );
        if (!inventory) throw new Error("Inventory not found");

        inventory.status = "on_memo";
        inventory.locked = true;
        inventory.price = bid.bidAmount;
        await inventory.save({ session });

        // Create deal (IMPORTANT: must be inside transaction)
        deal = await createDealService(
          bid._id.toString(),
          auction.sellerId.toString(),
          session // pass session
        );

        break;
      }

      case "REJECT":
      case "EXPIRE": {
        bid.status = action === "REJECT" ? "REJECTED" : "EXPIRED";
        bid.isHighestBid = false;
        await bid.save({ session });

        // if rejected/expired bid was highest, update auction to latest highest active bid
        if (auction.highestBidId?.toString() === bid._id.toString()) {
          const newHighestBid = await Bid.findOne({
            auctionId: auction._id,
            status: "ACTIVE",
          })
            .sort({ bidAmount: -1, createdAt: -1 })
            .session(session);

          if (newHighestBid) {
            auction.highestBidId = newHighestBid._id;
            auction.highestBidderId = newHighestBid.buyerId;
            auction.currentBid = newHighestBid.bidAmount;

            await Bid.updateOne(
              { _id: newHighestBid._id },
              { $set: { isHighestBid: true } },
              { session }
            );
          } else {
            auction.highestBidId = undefined;
            auction.highestBidderId = undefined;
            auction.currentBid = auction.basePrice;
          }

          await auction.save({ session });
        }

        break;
      }

      default:
        throw new Error("Invalid bid action");
    }

    await session.commitTransaction();
    session.endSession();

    // ✅ return both bid and deal
    return { bid, deal };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getBidsByAuctionService = async (auctionId: string) => {
  return Bid.find({ auctionId })
    .populate("buyerId", "name email")
    .sort({ bidAmount: -1, createdAt: -1 });
};

export const getHighestBidByAuctionService = async (auctionId: string) => {
  return Bid.findOne({
    auctionId,
    isHighestBid: true,
    status: "ACTIVE",
  }).populate("buyerId", "name email");
};

export const getMyBidService = async (auctionId: string, buyerId: string) => {
  if (
    !mongoose.Types.ObjectId.isValid(auctionId) ||
    !mongoose.Types.ObjectId.isValid(buyerId)
  ) {
    throw new Error("Invalid auctionId or buyerId");
  }

  return Bid.find({ auctionId, buyerId })
    .sort({ createdAt: -1 });
};
  