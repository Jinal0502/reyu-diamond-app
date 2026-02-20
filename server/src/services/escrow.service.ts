import Escrow from "../models/Escrow.model";
import { Deal } from "../models/Deal.model";
import { stripe } from "../config/stripe";
import { User } from "../models/User.model";
import mongoose from "mongoose";
import { CustomError } from "../utils/customError.utility";

export const createPaymentIntentForDealService = async (
  dealId: string,
  buyerId: string,
  note?: string,
) => {
  const deal = await Deal.findById(dealId);

  if (!deal) throw new Error("Deal not found");

  if (deal.buyerId.toString() !== buyerId.toString()) {
    throw new Error("You are not authorized as buyer for this deal");
  }

  const seller = await User.findById(deal.sellerId);

  if (!seller) throw new Error("Seller not found");

  if (!seller.stripeAccountId) throw new Error("Seller Stripe account not found");

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

  // Update Deal Status
  deal.status = "PAYMENT_PENDING";

  deal.history.push({
      status: "PAYMENT_PENDING",
      changedBy: buyerId as any,
      changedAt: new Date(),
      note : note || "",
  });
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
  role: string,
  note?: string,
) => {
  const deal = await Deal.findById(dealId);
  if(!deal) throw new CustomError("Deal not found" , 404);

  const escrow = await Escrow.findOne({dealId});
  if(!escrow) throw new CustomError("Escrow not found" , 404);

  if(escrow.status === "RELEASED"){
    throw new CustomError("Escrow already Released");
  }

  const isBuyer = deal.buyerId.toString() === userId;
  const isAdmin = role === "admin";

  if(!isBuyer && !isAdmin){
    throw new CustomError("Only buyer/admin can release escrow");
  }

  if(!deal.buyerConfirmedDelivered){
     throw new CustomError("Buyer confirmation required");
  }

  if(escrow.status !== "HELD"){
    throw new CustomError("Escrow must be HELD");
  }
  const seller = await User.findById(deal.sellerId);
  if(!seller?.stripeAccountId){
    throw new CustomError("Seller Stripe account missing");
  }

  const transfer = await stripe.transfers.create({
    amount : Math.round(escrow.amount * 100),
    currency : escrow.currency,
    destination : seller.stripeAccountId,
    transfer_group : `deal${dealId}`,
    metadata : {
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
  role: string,
  note?: string
) => {
  const deal = await Deal.findById(dealId);
  if (!deal) throw new Error("Deal not found");

  const escrow = await Escrow.findOne({ dealId });
  if (!escrow) throw new Error("Escrow not found");

  if (escrow.status !== "HELD") {
    throw new Error("Refund allowed only if HELD");
  }

  const isAdmin = role === "admin";
  if (!isAdmin) {
    throw new Error("Only admin can approve refund");
  }

  const refund = await stripe.refunds.create({
    charge: escrow.stripeChargeId,
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
