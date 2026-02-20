import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../config/stripe";
import Escrow from "../models/Escrow.model";
import { Deal } from "../models/Deal.model";

export const stripeWebhookController = async (req: Request, res: Response) => {
  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET as string
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        if(paymentIntent.status !== "succeeded") break;

        const escrow = await Escrow.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });

        if (!escrow) break;

        if(escrow.status === "HELD") break;

        escrow.status = "HELD";
        await escrow.save();

        // Update Deal status
        const deal = await Deal.findById(escrow.dealId);

        if(deal && deal.status !== "IN_ESCROW") {

          deal.status = "IN_ESCROW",
          deal.history.push({
            status : "IN_ESCROW",
            changedBy : deal.buyerId as any,
            changedAt : new Date(),
          });
          await deal.save();
        }

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const escrow = await Escrow.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });

        if (!escrow) break;

        if(escrow.status === "FAILED") break;

        escrow.status = "FAILED";
        await escrow.save();

        // ✅ Update Deal status
        const deal = await Deal.findById(escrow.dealId);
        if (deal && deal.status !== "PAYMENT_FAILED") {
          deal.status = "PAYMENT_FAILED";
          deal.history.push({
            status: "PAYMENT_FAILED",
            changedBy: deal.buyerId as any,
            changedAt: new Date(),
          });
          await deal.save();
        }

        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;

        const paymentIntentId = charge.payment_intent as string;

        const escrow = await Escrow.findOne({
          stripePaymentIntentId: paymentIntentId,
        });

        if (!escrow) break;

        escrow.stripeChargeId = charge.id;
        await escrow.save();

        break;
      }
      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId = charge.payment_intent as string;

        const escrow = await Escrow.findOne({
          stripePaymentIntentId: paymentIntentId,
        });

        if (!escrow) break;

        if (!escrow.stripeChargeId) {
          escrow.stripeChargeId = charge.id;
          await escrow.save();
        }

        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
