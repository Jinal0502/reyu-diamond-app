import mongoose from "mongoose";
import { Inventory } from "../models/Inventory.model";
import { Auction, IAuction } from "../models/Auction.model";
import logger from "../utils/logger";
import { CustomError, ErrorCode, HTTP_STATUS } from "../utils";

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
    if (!inventory) throw new CustomError("Inventory not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

    if (inventory.sellerId.toString() !== userId.toString())
      throw new CustomError("You are not allowed to create auction for this inventory", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);

    if (inventory.status !== "available")
      throw new CustomError("Inventory must be available to create auction", HTTP_STATUS.BAD_REQUEST, ErrorCode.INVENTORY_NOT_AVAILABLE);

    if (inventory.startingPrice >= basePrice)
      throw new CustomError("Base price must be greater than inventory price", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);

    const now = new Date();
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (sDate < now) throw new CustomError("Start date cannot be in the past", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    if (eDate <= sDate) throw new CustomError("End date must be after start date", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);

    const existingAuction = await Auction.findOne({
      inventoryId,
      status: { $in: ["upcoming", "active"] },
    }).session(session);

    if (existingAuction)
      throw new CustomError("Auction already exists for this inventory", HTTP_STATUS.CONFLICT, ErrorCode.AUCTION_ALREADY_EXISTS);

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

    logger.info("Auction created", { auctionId: auction[0]._id, inventoryId, userId });
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

  if (!auction) throw new CustomError("Auction not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  return auction;
};

// UPDATE
export const updateAuctionService = async (
  auctionId: string,
  updates: { startDate?: Date; endDate?: Date; basePrice?: number }
) => {
  const auction = await Auction.findById(auctionId).populate("inventoryId");
  if (!auction) throw new CustomError("Auction not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  // 🏁 Block updates ONLY if auction is fundamentally closed
  if (auction.status === "ended" || auction.status === "cancelled") {
    throw new CustomError("Cannot update a completed or cancelled auction", HTTP_STATUS.BAD_REQUEST, ErrorCode.AUCTION_NOT_ACTIVE);
  }

  const inventory = auction.inventoryId as any;

  // 🏗️ Handle Base Price (Only if not started and no bids)
  if (updates.basePrice !== undefined) {
    if (auction.status !== "upcoming")
      throw new CustomError("Cannot update base price once auction has started", HTTP_STATUS.BAD_REQUEST, ErrorCode.AUCTION_NOT_ACTIVE);
    
    if (auction.bidIds.length > 0)
      throw new CustomError("Cannot update base price after bids are placed", HTTP_STATUS.BAD_REQUEST, ErrorCode.AUCTION_HAS_BIDS);

    if (inventory.price > updates.basePrice)
      throw new CustomError("Base price must be greater than inventory price", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);

    auction.basePrice = updates.basePrice;
    auction.currentBid = updates.basePrice;
  }

  // 📅 Handle Start Date (Only if upcoming)
  if (updates.startDate) {
    if (auction.status !== "upcoming")
      throw new CustomError("Cannot update start date after auction has started", HTTP_STATUS.BAD_REQUEST, ErrorCode.AUCTION_NOT_ACTIVE);

    const sDate = new Date(updates.startDate);
    if (sDate < new Date()) throw new CustomError("Start date cannot be in the past", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    auction.startDate = sDate;
  }

  // ⌛ Handle End Date (ALLOWED for active auctions to extend)
  if (updates.endDate) {
    const eDate = new Date(updates.endDate);
    if (eDate <= auction.startDate)
      throw new CustomError("End date must be after start date", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
    
    if (eDate <= new Date())
      throw new CustomError("New end date cannot be in the past", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);

    auction.endDate = eDate;
  }

  if (updates.basePrice !== undefined) {
    auction.basePrice = updates.basePrice;
    auction.currentBid = updates.basePrice;
  }

  await auction.save();
  logger.info("Auction updated", { auctionId });
  return auction;
};

// DELETE
export const deleteAuctionService = async (auctionId: string) => {

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const auction = await Auction.findById(auctionId).session(session);
    if (!auction) throw new CustomError("Auction not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

    if (auction.bidIds.length > 0)
      throw new CustomError("Cannot delete auction with existing bids", HTTP_STATUS.BAD_REQUEST, ErrorCode.AUCTION_HAS_BIDS);

    await Inventory.findByIdAndUpdate(
      auction.inventoryId,
      { status: "available", locked: false },
      { session }
    );

    await Auction.findByIdAndDelete(auctionId, { session });

    await session.commitTransaction();
    session.endSession();

    logger.info("Auction deleted", { auctionId });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};