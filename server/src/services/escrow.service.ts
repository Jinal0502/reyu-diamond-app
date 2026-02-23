import Escrow from "../models/Escrow.model";
import { Deal } from "../models/Deal.model";
import { stripe } from "../config/stripe";
import { User } from "../models/User.model";
import mongoose from "mongoose";
import { CustomError } from "../utils/customError.utility";
import {
  handleSellerDealCompleted,
  handleBuyerDealCompleted,
  handleDealCancelled,
} from "./user-stats.service";

/* =======================================================
   CREATE PAYMENT INTENT
======================================================= */

export const createPaymentIntentForDealService = async (
  dealId: string,
  buyerId: string,
  note?: string
) => {
  const deal = await Deal.findById(dealId);
  if (!deal) throw new CustomError("Deal not found", 404);

  if (deal.buyerId.toString() !== buyerId.toString()) {
    throw new CustomError("Unauthorized buyer", 403);
  }

  const seller = await User.findById(deal.sellerId);
  if (!seller?.stripeAccountId) {
    throw new CustomError("Seller Stripe account missing", 400);
  }

  let escrow = await Escrow.findOne({ dealId });

  if (escrow && escrow.status !== "FAILED" && escrow.status !== "CANCELLED") {
    throw new CustomError("Escrow already exists", 400);
  }

  const amountInCents = Math.round(deal.dealAmount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    payment_method_types: ["card"],
    transfer_group: `deal_${dealId}`,
    metadata: {
      dealId,
      buyerId,
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
  if (!deal) throw new CustomError("Deal not found", 404);

  const escrow = await Escrow.findOne({ dealId });
  if (!escrow) throw new CustomError("Escrow not found", 404);

  if (escrow.status !== "HELD") {
    throw new CustomError("Escrow must be HELD", 400);
  }

  const isBuyer = deal.buyerId.toString() === userId;
  const isAdmin = role === "admin";

  if (!isBuyer && !isAdmin) {
    throw new CustomError("Only buyer/admin can release escrow", 403);
  }

  if (!deal.buyerConfirmedDelivered) {
    throw new CustomError("Buyer confirmation required", 400);
  }

  const seller = await User.findById(deal.sellerId);
  if (!seller?.stripeAccountId) {
    throw new CustomError("Seller Stripe account missing", 400);
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

  try {
    escrow.status = "RELEASED";
    escrow.stripeTransferId = transfer.id;
    await escrow.save({ session });

    deal.status = "COMPLETED";
    deal.history.push({
      status: "COMPLETED",
      changedBy: userId as any,
      changedAt: new Date(),
      note: note || "",
    });

    await deal.save({ session });

    await session.commitTransaction();
    session.endSession();

    // ✅ Stats update AFTER commit
    await handleSellerDealCompleted(deal.sellerId, deal.dealAmount);
    await handleBuyerDealCompleted(deal.buyerId);

    return {
      deal,
      escrow,
      transferId: transfer.id,
    };
  } catch (error) {
    await session.abortTransaction();
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
  if (!deal) throw new CustomError("Deal not found", 404);

  const escrow = await Escrow.findOne({ dealId });
  if (!escrow) throw new CustomError("Escrow not found", 404);

  if (escrow.status !== "HELD") {
    throw new CustomError("Refund allowed only if HELD", 400);
  }

  if (role !== "admin") {
    throw new CustomError("Only admin can approve refund", 403);
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

  try {
    escrow.status = "REFUNDED";
    escrow.stripeRefundId = refund.id;
    await escrow.save({ session });

    deal.status = "CANCELLED";
    deal.history.push({
      status: "CANCELLED",
      changedBy: userId as any,
      changedAt: new Date(),
      note: note || "",
    });

    await deal.save({ session });

    await session.commitTransaction();
    session.endSession();

    await handleDealCancelled({
      cancelledBy: new mongoose.Types.ObjectId(userId),
      buyerId: deal.buyerId,
      sellerId: deal.sellerId,
    });

    return {
      deal,
      escrow,
      refundId: refund.id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};