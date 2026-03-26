import Escrow from "../models/Escrow.model";
import { Deal } from "../models/Deal.model";
import { stripe } from "../config/stripe";
import { User } from "../models/User.model";
import mongoose from "mongoose";
import { CustomError, HTTP_STATUS, ErrorCode } from "../utils";
import {
  handleSellerDealCompleted,
  handleBuyerDealCompleted,
  handleDealCancelled,
} from "./user-stats.service";
import logger from "../utils/logger";
import * as NotificationEvents from "../notifications/events";
 import { Inventory } from "../models/Inventory.model";



/* =======================================================
   CREATE PAYMENT INTENT
======================================================= */

export const createPaymentIntentForDealService = async (
  dealId: string,
  buyerId: string,
  note?: string
) => {
  const deal = await Deal.findById(dealId);
  if (!deal) throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  if (deal.buyerId.toString() !== buyerId.toString()) {
    throw new CustomError("Unauthorized buyer", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
  }

  const seller = await User.findById(deal.sellerId);
  if (!seller?.stripeAccountId) {
    throw new CustomError("Seller Stripe account missing", HTTP_STATUS.BAD_REQUEST, ErrorCode.STRIPE_ACCOUNT_MISSING);
  }

  let escrow = await Escrow.findOne({ dealId });

  if (escrow && escrow.status !== "FAILED" && escrow.status !== "CANCELLED") {
    throw new CustomError("Escrow already exists", HTTP_STATUS.CONFLICT, ErrorCode.ESCROW_ALREADY_EXISTS);
  }

  const amountInCents = Math.round(deal.dealAmount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    payment_method_types: ["card"],
    transfer_group: `deal_${dealId}`,
    metadata: {
      dealId: dealId.toString(),
      buyerId: buyerId.toString(),
      sellerId: deal.sellerId.toString(),
    },
  });

  if (!escrow) {
    escrow = await Escrow.create({
      dealId,
      buyerId,
      sellerId: deal.sellerId,
      amount: deal.dealAmount,
      currency: "usd",
      status: "PAYMENT_INITIATED",
      stripePaymentIntentId: paymentIntent.id,
    });
  } else {
    escrow.stripePaymentIntentId = paymentIntent.id;
    escrow.status = "PAYMENT_INITIATED";
    await escrow.save();
  }

  deal.status = "PAYMENT_PENDING";
  deal.history.push({
    status: "PAYMENT_PENDING",
    changedBy: buyerId as any,
    changedAt: new Date(),
    note: note || "",
  });

  await deal.save();

  logger.info("Payment intent created for deal", { dealId, buyerId, paymentIntentId: paymentIntent.id });

  return {
    escrowId: escrow._id,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
};

/* =======================================================
   RELEASE ESCROW (SUCCESSFUL COMPLETION)
======================================================= */

export const releaseEscrowService = async (
  dealId: string,
  userId: string,
  role: string,
  note?: string
) => {
  const deal = await Deal.findById(dealId);
  if (!deal) throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  const escrow = await Escrow.findOne({ dealId });
  if (!escrow) throw new CustomError("Escrow not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  if (escrow.status !== "HELD") {
    throw new CustomError("Escrow must be HELD", HTTP_STATUS.BAD_REQUEST, ErrorCode.ESCROW_NOT_HELD);
  }

  const isBuyer = deal.buyerId.toString() === userId;
  const isAdmin = role === "admin";

  if (!isBuyer && !isAdmin) {
    throw new CustomError("Only buyer/admin can release escrow", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
  }

  if (!deal.buyerConfirmedDelivered) {
    throw new CustomError("Buyer confirmation required", HTTP_STATUS.BAD_REQUEST, ErrorCode.BUYER_CONFIRMATION_REQUIRED);
  }

  const seller = await User.findById(deal.sellerId);
  if (!seller?.stripeAccountId) {
    throw new CustomError("Seller Stripe account missing", HTTP_STATUS.BAD_REQUEST, ErrorCode.STRIPE_ACCOUNT_MISSING);
  }

  // Stripe transfer
  const transfer = await stripe.transfers.create({
    amount: Math.round(escrow.amount * 100),
    currency: escrow.currency,
    destination: seller.stripeAccountId,
    transfer_group: `deal_${dealId}`,
    metadata: {
      dealId,
      escrowId: escrow._id.toString(),
    },
  });

  const session = await mongoose.startSession();
  session.startTransaction();
  let transactionCommitted = false;

  try {
    escrow.status = "RELEASED";
    escrow.stripeTransferId = transfer.id;
    await escrow.save({ session });

    deal.status = "COMPLETED";
    deal.payment.isPaid = true;
    deal.history.push({
      status: "COMPLETED",
      changedBy: userId as any,
      changedAt: new Date(),
      note: note || "",
    });

    await deal.save({ session });

    const inventory = await Inventory.findById(deal.inventoryId);
    if (!inventory) {
      throw new CustomError("inventory not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
    }

    inventory.status = "sold";
    await inventory.save({ session });

    await session.commitTransaction();
    transactionCommitted = true;
    session.endSession();

    // ✅ Stats update AFTER commit
    await handleSellerDealCompleted(deal.sellerId, deal.dealAmount);
    await handleBuyerDealCompleted(deal.buyerId);

    logger.info("Escrow released, deal completed", { dealId, transferId: transfer.id });

    // 🔥 Notification
    NotificationEvents.notifyEscrowReleased(deal.sellerId.toString(), dealId);

    return {
      deal,
      escrow,
      transferId: transfer.id,
    };
  } catch (error) {
    if (!transactionCommitted) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
};

/* =======================================================
   REFUND ESCROW (ADMIN ONLY)
======================================================= */

export const refundEscrowService = async (
  dealId: string,
  userId: string,
  role: string,
  note?: string
) => {
  const deal = await Deal.findById(dealId);
  if (!deal) throw new CustomError("Deal not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  const escrow = await Escrow.findOne({ dealId });
  if (!escrow) throw new CustomError("Escrow not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);

  if (escrow.status !== "HELD") {
    throw new CustomError("Refund allowed only if HELD", HTTP_STATUS.BAD_REQUEST, ErrorCode.ESCROW_NOT_HELD);
  }

  if (role !== "admin") {
    throw new CustomError("Only admin can approve refund", HTTP_STATUS.FORBIDDEN, ErrorCode.FORBIDDEN);
  }

  const refund = await stripe.refunds.create({
    payment_intent: escrow.stripePaymentIntentId,
    metadata: {
      dealId,
      escrowId: escrow._id.toString(),
    },
  });

  const session = await mongoose.startSession();
  session.startTransaction();
  let transactionCommitted = false;

  try {
    escrow.status = "REFUNDED";
    escrow.stripeRefundId = refund.id;
    await escrow.save({ session });

    deal.status = "CANCELLED";
    deal.payment.isPaid = false;
    deal.history.push({
      status: "CANCELLED",
      changedBy: userId as any,
      changedAt: new Date(),
      note: note || "",
    });

    await deal.save({ session });

    await session.commitTransaction();
    transactionCommitted = true;
    session.endSession();

    await handleDealCancelled({
      cancelledBy: new mongoose.Types.ObjectId(userId),
      buyerId: deal.buyerId,
      sellerId: deal.sellerId,
    });

    logger.info("Escrow refunded, deal cancelled", { dealId, refundId: refund.id });

    return {
      deal,
      escrow,
      refundId: refund.id,
    };
  } catch (error) {
    if (!transactionCommitted) {
      await session.abortTransaction();
    }
    session.endSession();
    throw error;
  }
};