import Escrow from "../models/Escrow.model";
import { Deal } from "../models/Deal.model";
import { stripe } from "../config/stripe";
import { User } from "../models/User.model";
import mongoose from "mongoose";
import { CustomError } from "../utils/customError.utility";

export const createPaymentIntentForDealService = async (
  dealId: string,
  buyerId: string
) => {
  const deal = await Deal.findById(dealId);

  if (!deal) throw new Error("Deal not found");

  if (deal.buyerId.toString() !== buyerId.toString()) {
    throw new Error("You are not authorized as buyer for this deal");
  }

  const seller = await User.findById(deal.sellerId);

  if (!seller) throw new Error("Seller not found");

  if (!seller.stripeAccountId) throw new Error("Seller Stripe account not found");

  if (!seller.isKycVerified) throw new Error("Seller KYC not verified");

  let escrow = await Escrow.findOne({ dealId });

  if (escrow && escrow.status !== "FAILED" && escrow.status !== "CANCELLED") {
    throw new Error("Escrow already exists for this deal");
  }

  const amountInCents = Math.round(deal.dealAmount * 100);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "usd",
    payment_method_types: ["card"],
    transfer_group : `deal${dealId}`,
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

  // ✅ Update Deal Status
  deal.status = "PAYMENT_PENDING";
  await deal.save();

  return {
    escrowId: escrow._id,
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret,
  };
};

export const releaseEscrowService = async (
  dealId: string,
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
    const isAdmin = role === "admin";

    if (!isBuyer && !isAdmin) {
      throw new Error("Only buyer/admin can release escrow");
    }

    // must be delivered
    if (deal.status !== "DELIVERED") {
      throw new Error("Deal must be DELIVERED before releasing payment");
    }

    // buyer confirmation must be true (if you added fields)
    if (!deal.buyerConfirmedDelivered) {
      throw new Error("Buyer confirmation is required");
    }

    // escrow must be held
    if (escrow.status !== "HELD") {
      throw new Error("Escrow is not in HELD status");
    }

    const seller = await User.findById(deal.sellerId).session(session);
    if (!seller) throw new Error("Seller not found");

    if (!seller.stripeAccountId) {
      throw new Error("Seller Stripe account not found");
    }

    // Create Stripe Transfer
    const transfer = await stripe.transfers.create({
      amount: Math.round(escrow.amount * 100),
      currency: escrow.currency,
      destination: seller.stripeAccountId,
      transfer_group: seller.stripeAccountId,
      metadata: {
        dealId: dealId.toString(),
        escrowId: escrow._id.toString(),
        sellerId: seller._id.toString(),
      },
    });

    // Update escrow
    escrow.status = "RELEASED";
    escrow.stripeTransferId = transfer.id;
    await escrow.save({ session });

    // Update deal
    deal.status = "COMPLETED";
    deal.payment.isPaid = true;

    deal.history.push({
      status: "COMPLETED",
      changedBy: userId as any,
      changedAt: new Date(),
    });

    await deal.save({ session });

    await session.commitTransaction();
    session.endSession();

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


export const refundEscrowService = async (
  dealId: string,
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
    const isAdmin = role === "admin";

    // Only buyer or admin can request refund
    if (!isBuyer && !isAdmin) {
      throw new Error("Only buyer/admin can request refund");
    }

    // If already released, refund is not possible automatically
    if (escrow.status === "RELEASED") {
      throw new Error("Refund not possible because funds already transferred to seller");
    }

    // Refund allowed only if escrow is HELD
    if (escrow.status !== "HELD") {
      throw new Error(`Refund not allowed. Escrow status is ${escrow.status}`);
    }

    // Must have chargeId or paymentIntentId
    if (!escrow.stripeChargeId && !escrow.stripePaymentIntentId) {
      throw new Error("ChargeId or PaymentIntentId missing for refund");
    }

    // Create Stripe Refund
    const refund = await stripe.refunds.create({
      charge: escrow.stripeChargeId, // best option
      payment_intent: escrow.stripeChargeId ? undefined : escrow.stripePaymentIntentId,
      metadata: {
        dealId: dealId.toString(),
        escrowId: escrow._id.toString(),
        buyerId: deal.buyerId.toString(),
      },
    });

    // Update escrow
    escrow.status = "REFUNDED";
    escrow.stripeRefundId = refund.id;
    await escrow.save({ session });

    // Update deal status to CANCELLED
    deal.status = "CANCELLED";
    deal.payment.isPaid = false;

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
      refundId: refund.id,
    };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

