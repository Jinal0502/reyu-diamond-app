import mongoose from "mongoose";
import { Inventory } from "../models/Inventory.model";
import { Bid } from "../models/Bid.model";

export type BidAction = "ACCEPT" | "REJECT" | "EXPIRE";

interface CreateBidInput {
  inventoryId: string;
  buyerId: string;
  bidAmount: number;
}

export const createBidService = async ({
  inventoryId,
  buyerId,
  bidAmount,
}: CreateBidInput) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch inventory
    const inventory = await Inventory.findById(inventoryId).session(session);
    if (!inventory) throw new Error("Inventory not found");

    // 2. Business rules
    if (inventory.sellerId.toString() === buyerId) {
      throw new Error("You cannot bid on your own inventory");
    }

    if (inventory.locked || inventory.status !== "in_locker") {
      throw new Error("Inventory is not available for bidding");
    }

    // 3. Get current highest bid
    const currentHighestBid = await Bid.findOne({
      inventoryId,
      isHighestBid: true,
    }).session(session);

    const currentPrice = currentHighestBid
      ? currentHighestBid.bidAmount
      : inventory.startingPrice;

    if (bidAmount <= currentPrice) {
      throw new Error(`Bid must be higher than ${currentPrice}`);
    }

    // Prevent self-outbidding
    if (
      currentHighestBid &&
      currentHighestBid.buyerId.toString() === buyerId
    ) {
      throw new Error("You already have the highest bid");
    }

    // 4. Demote previous highest bid FIRST (atomic)
    if (currentHighestBid) {
      await Bid.updateOne(
        { _id: currentHighestBid._id },
        { $set: { isHighestBid: false } },
        { session }
      );
    }

    // 5. Create new bid as highest bid
    const [bid] = await Bid.create(
      [
        {
          inventoryId,
          buyerId,
          bidAmount,
          status: "ACTIVE",
          isHighestBid: true,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    return bid;
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();

    // Handle unique index race
    if (error.code === 11000) {
      throw new Error(
        "Bid conflict detected. Another higher bid already exists. Please retry."
      );
    }

    throw error;
  }
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

    const inventory = await Inventory.findById(bid.inventoryId).session(session);
    if (!inventory) throw new Error("Inventory not found");

    const isOwner = inventory.sellerId.toString() === userId;
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
      throw new Error("Access denied");
    }

    switch (action) {
      case "ACCEPT": {
        // Reject all other active bids
        await Bid.updateMany(
          {
            inventoryId: inventory._id,
            _id: { $ne: bid._id },
            status: "ACTIVE",
          },
          { $set: { status: "REJECTED", isHighestBid: false } },
          { session }
        );

        // Accept this bid
        bid.status = "ACCEPTED";
        bid.isHighestBid = false;
        await bid.save({ session });
        // Update inventory status and price
        inventory.price = bid.bidAmount;
        await inventory.save({ session });

        break;
      }

      case "REJECT": {
        bid.status = "REJECTED";
        bid.isHighestBid = false;
        await bid.save({ session });
        break;
      }

      case "EXPIRE": {
        bid.status = "EXPIRED";
        bid.isHighestBid = false;
        await bid.save({ session });
        break;
      }

      default: {
        throw new Error("Invalid bid action");
      }
    }

    await session.commitTransaction();
    session.endSession();

    return bid;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getBidsByInventoryService = async (inventoryId: string) => {
  return Bid.find({ inventoryId })
    .populate("buyerId", "name email")
    .sort({ bidAmount: -1, createdAt: -1 });
};

export const getMyBidService = async (
  inventoryId: string,
  buyerId: string
) => {
  if (
    !mongoose.Types.ObjectId.isValid(inventoryId) ||
    !mongoose.Types.ObjectId.isValid(buyerId)
  ) {
    throw new Error("Invalid inventoryId or buyerId");
  }

  return Bid.findOne({ inventoryId, buyerId })
    .populate("inventoryId", "barcode shape carat startingPrice status")
    .sort({ createdAt: -1 });
};
