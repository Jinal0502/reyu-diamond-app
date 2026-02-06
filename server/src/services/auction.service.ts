import mongoose from "mongoose";
import { Inventory } from "../models/Inventory.model";
import { Auction, IAuction } from "../models/Auction.model";
import { createDealService } from "./deal.service";

export type AuctionAction = "START" | "END" | "CANCEL";

interface CreateAuctionInput {
  inventoryId: string;
  basePrice: number;
  startDate: Date;
  endDate: Date;
  userId: string;
}

// CREATE AUCTION
export const createAuctionService = async ({
  inventoryId,
  basePrice,
  startDate,
  endDate,
  userId,
}: CreateAuctionInput): Promise<IAuction> => {
  const useTransaction = process.env.NODE_ENV === "production";
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const inventory = await Inventory.findById(inventoryId).session(session);
    if (!inventory) throw new Error("Inventory not found");

    if (inventory.sellerId.toString() !== userId.toString())
      throw new Error("You are not allowed to create auction for this inventory");

    if (inventory.status !== "available")
      throw new Error("Inventory must be available to create auction");

    if (inventory.price >= basePrice)
      throw new Error("Base price must be greater than inventory price");

    const now = new Date();
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (sDate < now) throw new Error("Start date cannot be in the past");
    if (eDate <= sDate) throw new Error("End date must be after start date");

    const existingAuction = await Auction.findOne({
      inventoryId,
      status: { $ne: "cancelled" },
    }).session(session);

    if (existingAuction) throw new Error("Auction already exists for this inventory");

    const auction = await Auction.create(
      [
        {
          inventoryId: inventory._id,
          sellerId: inventory.sellerId,
          basePrice,
          currentBid: basePrice,
          startDate: sDate,
          endDate: eDate,
          bidIds: [],
          status: "upcoming",
          locked: false,
        },
      ],
      { session }
    );

    inventory.status = "listed";
    inventory.locked = true;
    inventory.listedAt = new Date();
    await inventory.save({ session });

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    if (!auction[0]) throw new Error("Failed to create auction");
    return auction[0];
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};

// GET AUCTIONS
export const getAuctionsService = async (filters: any = {}): Promise<IAuction[]> => {
  return Auction.find(filters)
    .populate("inventoryId")
    .populate("sellerId", "name email")
    .populate("highestBidderId", "name email")
    .sort({ endDate: 1 });
};

// GET AUCTION BY ID
export const getAuctionByIdService = async (auctionId: string): Promise<IAuction> => {
  const auction = await Auction.findById(auctionId)
    .populate("inventoryId")
    .populate("sellerId", "name email")
    .populate("highestBidderId", "name email")
    .populate("highestBidId")
    .populate("bidIds");

  if (!auction) throw new Error("Auction not found");
  return auction;
};

// UPDATE AUCTION
export const updateAuctionService = async (
  auctionId: string,
  updates: { startDate?: Date; endDate?: Date; basePrice?: number }
): Promise<IAuction> => {
  const auction = await Auction.findById(auctionId).populate("inventoryId");
  if (!auction) throw new Error("Auction not found");

  if (auction.status !== "upcoming" || auction.locked)
    throw new Error("Auction cannot be updated after it starts");

  if (auction.bidIds.length > 0)
    throw new Error("Cannot update auction with existing bids");

  const inventory = auction.inventoryId as any;

  if (updates.basePrice !== undefined && inventory.price > updates.basePrice)
    throw new Error("Base price must be greater than inventory price");

  if (updates.startDate) {
    const sDate = new Date(updates.startDate);
    if (sDate < new Date()) throw new Error("Start date cannot be in the past");
    auction.startDate = sDate;
  }

  if (updates.endDate) {
    const eDate = new Date(updates.endDate);
    if (eDate <= auction.startDate)
      throw new Error("End date must be after start date");
    auction.endDate = eDate;
  }

  if (updates.basePrice !== undefined) {
    auction.basePrice = updates.basePrice;
    auction.currentBid = updates.basePrice;
  }

  await auction.save();
  return auction;
};

// UPDATE AUCTION STATUS
export const updateAuctionStatusService = async (
  auctionId: string,
  action: AuctionAction
): Promise<IAuction> => {
  const useTransaction = process.env.NODE_ENV === "production";
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const auction = await Auction.findById(auctionId).session(session);
    if (!auction) throw new Error("Auction not found");

    const inventory = await Inventory.findById(auction.inventoryId).session(session);
    if (!inventory) throw new Error("Inventory not found");

    switch (action) {
      case "START":
        if (auction.status !== "upcoming")
          throw new Error("Only upcoming auctions can be started");

        if (new Date() < new Date(auction.startDate))
          throw new Error("Auction start date has not arrived yet");

        auction.status = "active";
        break;

      case "END":
        if (auction.status !== "active")
          throw new Error("Only active auctions can be ended");

        auction.status = "ended";
        auction.locked = true;
        auction.endedAt = new Date();

        inventory.status = "sold"; // OR "deal_created"
        inventory.locked = true;
        await inventory.save({ session });

        // Create Deal if highest bid exists
        if (auction.highestBidId) {
          await createDealService(
            auction.highestBidId.toString(),
            auction.sellerId.toString(),
            session as mongoose.mongo.ClientSession
  );
}


        break;

      case "CANCEL":
        if (auction.status === "ended")
          throw new Error("Cannot cancel ended auction");

        auction.status = "cancelled";
        auction.locked = true;
        auction.cancelledAt = new Date();

        inventory.status = "available";
        inventory.locked = false;
        await inventory.save({ session });

        break;

      default:
        throw new Error("Invalid auction action");
    }

    await auction.save({ session });

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return auction;
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};

// DELETE AUCTION
export const deleteAuctionService = async (auctionId: string): Promise<void> => {
  const useTransaction = process.env.NODE_ENV === "production";
  const session = useTransaction ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const auction = await Auction.findById(auctionId).session(session);
    if (!auction) throw new Error("Auction not found");

    if (auction.bidIds.length > 0)
      throw new Error("Cannot delete auction with existing bids");

    await Inventory.findByIdAndUpdate(
      auction.inventoryId,
      { status: "available", locked: false },
      { session }
    );

    await Auction.findByIdAndDelete(auctionId, { session });

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }
  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }
};

// AUTO CLOSE AUCTION
export const closeAuctionAutomatically = async (auctionId: string): Promise<IAuction> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const auction = await Auction.findById(auctionId).session(session);
    if (!auction) throw new Error("Auction not found");

    if (auction.status !== "active") {
      await session.commitTransaction();
      session.endSession();
      return auction;
    }

    const now = new Date();
    if (auction.endDate > now) throw new Error("Auction has not ended yet");

    auction.status = "ended";
    auction.locked = true;
    auction.endedAt = now;
    await auction.save({ session });

    if (auction.highestBidId) {
      await createDealService(
        auction.highestBidId.toString(),
        auction.sellerId.toString(),
        session
      );
    }

    await session.commitTransaction();
    session.endSession();

    return auction;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
