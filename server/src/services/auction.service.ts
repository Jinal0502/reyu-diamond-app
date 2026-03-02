import mongoose from "mongoose";
import { Inventory } from "../models/Inventory.model";
import { Auction, IAuction } from "../models/Auction.model";

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

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const inventory = await Inventory.findById(inventoryId).session(session);
    if (!inventory) throw new Error("Inventory not found");

    if (inventory.sellerId.toString() !== userId.toString())
      throw new Error("You are not allowed to create auction for this inventory");

    if (inventory.status !== "available")
      throw new Error("Inventory must be available to create auction");

    if (inventory.startingPrice >= basePrice)
      throw new Error("Base price must be greater than inventory price");

    const now = new Date();
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (sDate < now) throw new Error("Start date cannot be in the past");
    if (eDate <= sDate) throw new Error("End date must be after start date");

    const existingAuction = await Auction.findOne({
      inventoryId,
      status: { $in: ["upcoming", "active"] },
    }).session(session);

    if (existingAuction)
      throw new Error("Auction already exists for this inventory");

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

    await session.commitTransaction();
    session.endSession();

    return auction[0];

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// GET
export const getAuctionsService = async (filters: any = {}) => {
  return Auction.find(filters)
    .populate("inventoryId")
    .populate("sellerId", "name email")
    .populate("highestBidderId", "name email")
    .sort({ endDate: 1 });
};

export const getAuctionByIdService = async (auctionId: string) => {
  const auction = await Auction.findById(auctionId)
    .populate("inventoryId")
    .populate("sellerId", "name email")
    .populate("highestBidderId", "name email")
    .populate("highestBidId")
    .populate("bidIds");

  if (!auction) throw new Error("Auction not found");
  return auction;
};

// UPDATE
export const updateAuctionService = async (
  auctionId: string,
  updates: { startDate?: Date; endDate?: Date; basePrice?: number }
) => {
  const auction = await Auction.findById(auctionId).populate("inventoryId");
  if (!auction) throw new Error("Auction not found");

  if (auction.status !== "upcoming")
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

// DELETE
export const deleteAuctionService = async (auctionId: string) => {

  const session = await mongoose.startSession();
  session.startTransaction();

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

    await session.commitTransaction();
    session.endSession();

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};