import mongoose from "mongoose";
import { Deal, DealStatus, DEAL_TRANSITIONS } from "../models/Deal.model";
import { User } from "../models/User.model";
import { Bid } from "../models/Bid.model";
import { Auction } from "../models/Auction.model";
import { Inventory } from "../models/Inventory.model";
import Escrow from "../models/Escrow.model";
import { releaseEscrowService, refundEscrowService } from "../services/escrow.service";
import { handleDealCancelled } from "./user-stats.service";
import logger from "../utils/logger";
import { CustomError, ErrorCode, HTTP_STATUS } from "../utils";
import * as NotificationEvents from "../notifications/events";

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
  if (!bid) throw new CustomError("Bid not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  const auction = await Auction.findById(bid.auctionId).session(session);
  if (!auction) throw new CustomError("Auction not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  if (auction.sellerId.toString() !== sellerId) {
    throw new CustomError("Seller mismatch", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
  }

  const inventory = await Inventory.findById(auction.inventoryId).session(session);
  if (!inventory) throw new CustomError("Inventory not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  const existingDeal = await Deal.findOne({ bidId: bid._id }).session(session);
  if (existingDeal) throw new CustomError("Deal already exists for this bid", HTTP_STATUS.CONFLICT, ErrorCode.DEAL_ALREADY_EXISTS);

  // Inventory must already be moved to memo by bid accept logic

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

  logger.info("Deal created", { dealId: deal._id, bidId, sellerId, buyerId: bid.buyerId });

  // 🔥 Notifications
  NotificationEvents.notifyDealCreated(bid.buyerId.toString(), deal._id.toString());
  NotificationEvents.notifyDealCreated(sellerId, deal._id.toString());

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
  role: string,
  note?: string,
  shippingData?: {
    courier?: string;
    trackingNumber?: string;
  }
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  let sellerIdForStats: mongoose.Types.ObjectId | null = null;

  try {
    const deal = await Deal.findById(dealId).session(session);
    if (!deal) throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

    const allowed = DEAL_TRANSITIONS[deal.status];
    if (!allowed.includes(newStatus)) {
      throw new CustomError(
        `Invalid transition from ${deal.status} to ${newStatus}`,
        HTTP_STATUS.BAD_REQUEST,
        ErrorCode.INVALID_STATUS_TRANSITION
      );
    }

    const isSeller = deal.sellerId.toString() === userId;
    const isBuyer = deal.buyerId.toString() === userId;
    const isAdmin = role === "admin";

    switch (newStatus) {
      case "SHIPPED":
        if (!isSeller && !isAdmin) {
          throw new CustomError("Only seller/admin can mark shipped", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
        }

        deal.sellerConfirmedShipped = true;
        deal.shipping = {
          ...deal.shipping,
          courier: shippingData?.courier,
          trackingNumber: shippingData?.trackingNumber,
          shippedAt: new Date(),
        };

        break;

      case "DELIVERED":
        if (!isBuyer && !isAdmin) {
          throw new CustomError("Only buyer/admin can confirm delivery", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
        }

        deal.buyerConfirmedDelivered = true;
        deal.shipping = {
          ...deal.shipping,
          deliveredAt: new Date(),
        };
        break;

      case "DISPUTED":
        if (!isBuyer && !isSeller && !isAdmin) {
          throw new CustomError("Only participants/admin can dispute", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
        }

        deal.dispute = {
          reason: note || "Dispute raised",
          raisedBy: new mongoose.Types.ObjectId(userId),
          raisedAt: new Date(),
        };
        break;
    }

    deal.status = newStatus;

    deal.history.push({
      status: newStatus,
      changedBy: new mongoose.Types.ObjectId(userId),
      changedAt: new Date(),
      note: note || "",
    });

    await deal.save({ session });

    // 🔥 Notifications
    const buyerIdStr = deal.buyerId.toString();
    const sellerIdStr = deal.sellerId.toString();

    // Fetch diamond name for better notification body
    const inventory = await Inventory.findById(deal.inventoryId).select("title").lean();
    const dName = inventory?.title || "Diamond";

    if (newStatus === "SHIPPED") {
      NotificationEvents.notifyDealShipped(buyerIdStr, dName, dealId);
    } else if (newStatus === "DELIVERED") {
      NotificationEvents.notifyDealDelivered(sellerIdStr, dName, dealId);
    } else if (newStatus === "DISPUTED") {
      NotificationEvents.notifyDisputeRaised(buyerIdStr, dealId);
      NotificationEvents.notifyDisputeRaised(sellerIdStr, dealId);
      NotificationEvents.notifyCriticalSystemError(`Dispute raised on Deal #${dealId} by ${role} ${userId}`);
    }

    await session.commitTransaction();
    session.endSession();

    logger.info("Deal status updated", { dealId, newStatus, userId });
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

  if (!deal) throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  const isParticipant =
    deal.buyerId._id.toString() === userId ||
    deal.sellerId._id.toString() === userId ||
    role === "admin";

  if (!isParticipant) throw new CustomError("Access denied", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);

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
  role: string,
  note?: string
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deal = await Deal.findById(dealId).session(session);
    if (!deal) throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

    const isBuyer = deal.buyerId.toString() === userId;
    const isSeller = deal.sellerId.toString() === userId;
    const isAdmin = role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      throw new CustomError("Only buyer/seller/admin can cancel deal", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
    }

    if (deal.status === "COMPLETED") {
      throw new CustomError("Completed deal cannot be cancelled", HTTP_STATUS.BAD_REQUEST, ErrorCode.DEAL_ALREADY_COMPLETED);
    }

    // find escrow
    const escrow = await Escrow.findOne({ dealId }).session(session);

    // if payment already held => refund must happen
    if (escrow && escrow.status === "HELD") {
      await session.commitTransaction();
      session.endSession();

      // refund service uses its own transaction
      return await refundEscrowService(dealId, userId, role, note!);
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
      note: note || ""
    });

    await deal.save({ session });

    await session.commitTransaction();
    session.endSession();

    await handleDealCancelled({
      cancelledBy: userId as any,
      buyerId: deal.buyerId,
      sellerId: deal.sellerId
    });

    // 🔥 Notification
    const otherPartyId = isBuyer ? deal.sellerId.toString() : deal.buyerId.toString();
    NotificationEvents.notifyDealCancelled(otherPartyId, dealId, note);

    logger.info("Deal cancelled", { dealId, cancelledBy: userId });
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
  role: string,
  note?: string,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deal = await Deal.findById(dealId).session(session);
    if (!deal) throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

    const escrow = await Escrow.findOne({ dealId }).session(session);
    if (!escrow) throw new CustomError("Escrow not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

    const isBuyer = deal.buyerId.toString() === userId;
    const isSeller = deal.sellerId.toString() === userId;
    const isAdmin = role === "admin";

    if (!isBuyer && !isSeller && !isAdmin) {
      throw new CustomError("Only buyer/seller/admin can raise dispute", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
    }

    if (escrow.status !== "HELD") {
      throw new CustomError("Dispute can only be raised when escrow is HELD", HTTP_STATUS.BAD_REQUEST, ErrorCode.BAD_REQUEST);
    }

    if (deal.status === "DISPUTED") {
      throw new CustomError("Deal already disputed", HTTP_STATUS.BAD_REQUEST, ErrorCode.INVALID_STATUS_TRANSITION);
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
      note: note || ""
    });

    await deal.save({ session });

    await session.commitTransaction();
    session.endSession();

    logger.info("Dispute raised on deal", { dealId, raisedBy: userId });
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
  role: string,
  note?: string,
) => {
  if (role !== "admin") {
    throw new CustomError("Only admin can resolve disputes", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
  }

  const deal = await Deal.findById(dealId);
  if (!deal) throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  const escrow = await Escrow.findOne({ dealId });
  if (!escrow) throw new CustomError("Escrow not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  if (deal.status !== "DISPUTED") {
    throw new CustomError("Deal is not in disputed state", HTTP_STATUS.BAD_REQUEST, ErrorCode.DEAL_NOT_DISPUTED);
  }

  if (escrow.status !== "HELD") {
    throw new CustomError("Escrow must be HELD to resolve dispute", HTTP_STATUS.BAD_REQUEST, ErrorCode.ESCROW_NOT_HELD);
  }

  // update dispute resolution fields
  deal.dispute = {
    ...deal.dispute,
    reason: deal.dispute?.reason!,
    raisedBy: deal.dispute?.raisedBy!,
    raisedAt: deal.dispute?.raisedAt!,
    resolvedBy: userId as any,
    resolvedAt: new Date(),
    resolution,
    adminNote,
  };

  await deal.save();

  logger.info("Dispute resolved", { dealId, resolution, resolvedBy: userId });

  // 🔥 Notification
  const resText = resolution === "REFUND_BUYER" ? "Refund approved for Buyer" : "Funds released to Seller";
  NotificationEvents.notifyDisputeResolved(deal.buyerId.toString(), dealId, resText);
  NotificationEvents.notifyDisputeResolved(deal.sellerId.toString(), dealId, resText);

  // now execute action based on resolution
  if (resolution === "REFUND_BUYER") {
    return await refundEscrowService(dealId, userId, role, note!);
  }

  if (resolution === "RELEASE_SELLER") {
    return await releaseEscrowService(dealId, userId, role, note!);
  }

  throw new CustomError("Invalid resolution type", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
};
