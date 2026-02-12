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

        const escrow = await Escrow.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });

        if (!escrow) break;

        escrow.status = "HELD";
        await escrow.save();

        // ✅ Update Deal status
        await Deal.findByIdAndUpdate(escrow.dealId, {
          status: "IN_ESCROW",
        });

        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const escrow = await Escrow.findOne({
          stripePaymentIntentId: paymentIntent.id,
        });

        if (!escrow) break;

        escrow.status = "FAILED";
        await escrow.save();

        // ✅ Update Deal status
        await Deal.findByIdAndUpdate(escrow.dealId, {
          status: "PAYMENT_FAILED",
        });

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
