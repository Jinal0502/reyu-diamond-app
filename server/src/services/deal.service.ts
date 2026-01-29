import mongoose from "mongoose";
import { Deal } from "../models/Deal.model";
import { Bid } from "../models/Bid.model";
import { Inventory } from "../models/Inventory.model";
import { DEAL_TRANSITIONS, DealStatus } from "../models/Deal.model";

export const createDealService = async (
  bidId: string,
  sellerId: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const bid = await Bid.findById(bidId).session(session);
    if (!bid || bid.status !== "ACCEPTED") {
      throw new Error("Bid not found or not accepted");
    }

    const inventory = await Inventory.findById(bid.inventoryId).session(session);
    if (!inventory || inventory.status !== "in_locker") {
      throw new Error("Inventory not available");
    }
    if(inventory.sellerId.toString() !== sellerId) {
      throw new Error("Seller mismatch");
    }

    // Move inventory to memo
    inventory.status = "on_memo";
    inventory.locked = true;
    await inventory.save({ session });

    const deal = await Deal.create(
      [
        {
          bidId: bid._id,
          inventoryId: inventory._id,
          buyerId: bid.buyerId,
          sellerId,
          dealAmount: bid.bidAmount,
          currency: "INR",
          status: "CREATED",
          history: [{ status: "CREATED", changedBy: sellerId }],
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return deal[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Secure deal status update
 */
export const updateDealStatus = async (
  dealId: string,
  newStatus: DealStatus,
  userId: string,
  role: string
) => {
  const deal = await Deal.findById(dealId);
  if (!deal) throw new Error("Deal not found");

  // Transition validation
  const allowed = DEAL_TRANSITIONS[deal.status];
  if (!allowed.includes(newStatus)) {
    throw new Error(
      `Invalid transition from ${deal.status} to ${newStatus}`
    );
  }

  // Actor validation
  const isSeller = deal.sellerId.toString() === userId;
  const isBuyer = deal.buyerId.toString() === userId;
  const isAdmin = role === "admin";

  switch (newStatus) {
    case "SHIPPED":
      if (!isSeller && !isAdmin)
        throw new Error("Only seller can mark as shipped");
      break;

    case "DELIVERED":
      if (!isBuyer && !isAdmin)
        throw new Error("Only buyer can confirm delivery");
      break;

    case "CANCELLED":
      if (!isSeller && !isBuyer && !isAdmin)
        throw new Error("Not allowed to cancel deal");
      break;

    case "COMPLETED":
      if (!isAdmin)
        throw new Error("Only admin/system can complete deal");
      break;
  }

  deal.status = newStatus;
  deal.history.push({
    status: newStatus,
    changedBy: userId as any,
    changedAt: new Date(),
  });

  return deal.save();
};

export const getDealById = async (
  dealId: string,
  userId: string,
  role: string
) => {
  const deal = await Deal.findById(dealId)
    .populate("inventoryId")
    .populate("buyerId", "name email")
    .populate("sellerId", "name email");

  if (!deal) throw new Error("Deal not found");

  const isParticipant =
    deal.buyerId._id.toString() === userId ||
    deal.sellerId._id.toString() === userId ||
    role === "admin";

  if (!isParticipant) throw new Error("Access denied");

  return deal;
};

export const getDealsForUser = async (userId: string, role: string) => {
  const query =
    role === "admin"
      ? {}
      : { $or: [{ buyerId: userId }, { sellerId: userId }] };

  return Deal.find(query)
    .sort({ createdAt: -1 })
    .populate("inventoryId")
    .populate("buyerId", "name")
    .populate("sellerId", "name");
};
