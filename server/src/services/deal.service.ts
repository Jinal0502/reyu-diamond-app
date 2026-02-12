import mongoose from "mongoose";
import { Deal, DealStatus, DEAL_TRANSITIONS } from "../models/Deal.model";
import { Bid } from "../models/Bid.model";
import { Auction } from "../models/Auction.model";
import { Inventory } from "../models/Inventory.model";
import Escrow from "../models/Escrow.model";
import { releaseEscrowService , refundEscrowService } from "../services/escrow.service";

/**
 * Deal will be created automatically when bid is ACCEPTED
 * Must be called inside bid.service with same session.
 */
export const createDealService = async (
  bidId: string,
  sellerId: string,
  session: mongoose.ClientSession
) => {
  const bid = await Bid.findById(bidId).session(session);
  if (!bid) throw new Error("Bid not found");

  if (bid.status !== "ACCEPTED") {
    throw new Error("Only accepted bids can create deal");
  }

  const auction = await Auction.findById(bid.auctionId).session(session);
  if (!auction) throw new Error("Auction not found");

  if (auction.sellerId.toString() !== sellerId) {
    throw new Error("Seller mismatch");
  }

  const inventory = await Inventory.findById(auction.inventoryId).session(
    session
  );
  if (!inventory) throw new Error("Inventory not found");

  // Prevent duplicate deal
  const existingDeal = await Deal.findOne({ bidId: bid._id }).session(session);
  if (existingDeal) throw new Error("Deal already exists for this bid");

  // Inventory must already be moved to memo by bid accept logic
  if (inventory.status !== "on_memo") {
    throw new Error("Inventory must be on memo before deal creation");
  }

  const [deal] = await Deal.create(
    [
      {
        bidId: bid._id,
        auctionId: auction._id,
        inventoryId: inventory._id,
        buyerId: bid.buyerId,
        sellerId,
        dealAmount: bid.bidAmount,
        currency: "INR",
        status: "CREATED",
        payment: { isPaid: false },
        history: [
          {
            status: "CREATED",
            changedBy: sellerId,
            changedAt: new Date(),
          },
        ],
      },
    ],
    { session }
  );

  return deal;
};

/**
 * Secure deal status update with transition rules
 * Also updates inventory status based on deal status
 */
export const updateDealStatusService = async (
  dealId: string,
  newStatus: DealStatus,
  userId: string,
  role: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deal = await Deal.findById(dealId).session(session);
    if (!deal) throw new Error("Deal not found");

    const allowed = DEAL_TRANSITIONS[deal.status];
    if (!allowed.includes(newStatus)) {
      throw new Error(`Invalid transition from ${deal.status} to ${newStatus}`);
    }

    const isSeller = deal.sellerId.toString() === userId;
    const isBuyer = deal.buyerId.toString() === userId;
    const isAdmin = role === "admin";

    // Role validation
    switch (newStatus) {
      case "SHIPPED":
        if (!isSeller && !isAdmin) {
          throw new Error("Only seller/admin can mark shipped");
        }
        deal.sellerConfirmedShipped = true;
        break;

      case "DELIVERED":
        if (!isBuyer && !isAdmin) {
          throw new Error("Only buyer/admin can confirm delivery");
        }
        deal.buyerConfirmedDelivered = true;
        break;

      case "DISPUTED":
        if (!isBuyer && !isSeller && !isAdmin) {
          throw new Error("Only participants/admin can dispute");
        }
        break;

      case "CANCELLED":
        if (!isBuyer && !isSeller && !isAdmin) {
          throw new Error("Not allowed to cancel deal");
        }
        break;

      case "COMPLETED":
        if (!isAdmin) {
          throw new Error("Only admin/system can complete deal");
        }
        break;
    }

    // Update deal status
    deal.status = newStatus;

    deal.history.push({
      status: newStatus,
      changedBy: userId as any,
      changedAt: new Date(),
    });

    // Auto timestamps
    if (newStatus === "SHIPPED") {
      deal.shipping = {
        ...deal.shipping,
        shippedAt: new Date(),
      };
    }

    if (newStatus === "DELIVERED") {
      deal.shipping = {
        ...deal.shipping,
        deliveredAt: new Date(),
      };
    }

    await deal.save({ session });

    // Update inventory based on deal status
    const inventory = await Inventory.findById(deal.inventoryId).session(
      session
    );

    if (inventory) {
      // Deal completed => Sold
      if (newStatus === "COMPLETED") {
        inventory.status = "sold";
        inventory.locked = true;
        inventory.price = deal.dealAmount;
        await inventory.save({ session });
      }

      // Deal cancelled => Back available
      if (newStatus === "CANCELLED") {
        inventory.status = "available";
        inventory.locked = false;
        await inventory.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return deal;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const getDealByIdService = async (
  dealId: string,
  userId: string,
  role: string
) => {
  const deal = await Deal.findById(dealId)
    .populate("inventoryId")
    .populate("auctionId")
    .populate("bidId")
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

export const getDealsForUserService = async (userId: string, role: string) => {
  const query =
    role === "admin"
      ? {}
      : { $or: [{ buyerId: userId }, { sellerId: userId }] };

  return Deal.find(query)
    .sort({ createdAt: -1 })
    .populate("inventoryId")
    .populate("auctionId")
    .populate("buyerId", "name")
    .populate("sellerId", "name");
};

export const cancelDealService = async (
  dealId: string,
  userId: string,
  role: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deal = await Deal.findById(dealId).session(session);
    if (!deal) throw new Error("Deal not found");

    const isBuyer = deal.buyerId.toString() === userId;
    const isSeller = deal.sellerId.toString() === userId;
    const isAdmin = role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      throw new Error("Only buyer/seller/admin can cancel deal");
    }

    // if already completed, cannot cancel
    if (deal.status === "COMPLETED") {
      throw new Error("Completed deal cannot be cancelled");
    }

    // find escrow
    const escrow = await Escrow.findOne({ dealId }).session(session);

    // if payment already held => refund must happen
    if (escrow && escrow.status === "HELD") {
      await session.commitTransaction();
      session.endSession();

      // refund service uses its own transaction
      return await refundEscrowService(dealId, userId, role);
    }

    // if payment was initiated but not held
    if (escrow && escrow.status === "PAYMENT_INITIATED") {
      escrow.status = "CANCELLED";
      await escrow.save({ session });
    }

    // cancel deal directly
    deal.status = "CANCELLED";

    deal.history.push({
      status: "CANCELLED",
      changedBy: userId as any,
      changedAt: new Date(),
    });

    await deal.save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      deal,
      escrow,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const raiseDisputeService = async (
  dealId: string,
  reason: string,
  userId: string,
  role: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deal = await Deal.findById(dealId).session(session);
    if (!deal) throw new Error("Deal not found");

    const escrow = await Escrow.findOne({ dealId }).session(session);
    if (!escrow) throw new Error("Escrow not found");

    const isBuyer = deal.buyerId.toString() === userId;
    const isSeller = deal.sellerId.toString() === userId;
    const isAdmin = role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      throw new Error("Only buyer/seller/admin can raise dispute");
    }

    // dispute can happen only when money is in escrow
    if (escrow.status !== "HELD") {
      throw new Error("Dispute can only be raised when escrow is HELD");
    }

    if (deal.status === "DISPUTED") {
      throw new Error("Deal already disputed");
    }

    deal.status = "DISPUTED";

    deal.dispute = {
      reason,
      raisedBy: userId as any,
      raisedAt: new Date(),
    };

    deal.history.push({
      status: "DISPUTED",
      changedBy: userId as any,
      changedAt: new Date(),
    });

    await deal.save({ session });

    await session.commitTransaction();
    session.endSession();

    return deal;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const resolveDisputeService = async (
  dealId: string,
  resolution: "REFUND_BUYER" | "RELEASE_SELLER",
  adminNote: string,
  userId: string,
  role: string
) => {
  if (role !== "admin") {
    throw new Error("Only admin can resolve disputes");
  }

  const deal = await Deal.findById(dealId);
  if (!deal) throw new Error("Deal not found");

  const escrow = await Escrow.findOne({ dealId });
  if (!escrow) throw new Error("Escrow not found");

  if (deal.status !== "DISPUTED") {
    throw new Error("Deal is not in disputed state");
  }

  if (escrow.status !== "HELD") {
    throw new Error("Escrow must be HELD to resolve dispute");
  }

  // update dispute resolution fields
  deal.dispute = {
    ...deal.dispute,
    reason : deal.dispute?.reason!,
    raisedBy: deal.dispute?.raisedBy! ,
    raisedAt: deal.dispute?.raisedAt!,
    resolvedBy: userId as any,
    resolvedAt: new Date(),
    resolution,
    adminNote,
  };

  await deal.save();

  // now execute action based on resolution
  if (resolution === "REFUND_BUYER") {
    return await refundEscrowService(dealId, userId, role);
  }

  if (resolution === "RELEASE_SELLER") {
    return await releaseEscrowService(dealId, userId, role);
  }

  throw new Error("Invalid resolution type");
};
