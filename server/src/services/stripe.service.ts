import { stripe } from "../config/stripe";
import { User } from "../models/User.model";

export const createStripeConnectedAccountService = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // If already created
  if (user.stripeAccountId) {
    return {
      alreadyExists: true,
      accountId: user.stripeAccountId,
    };
  }

  // Create Stripe connected account
  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: user.email,
    capabilities: {
      transfers: { requested: true },
    },
  });

  // Save to DB
  user.stripeAccountId = account.id;
  user.stripeOnboardingStatus = "PENDING";
  await user.save();

  return {
    alreadyExists: false,
    accountId: account.id,
  };
};

export const generateOnboardingLinkService = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.stripeAccountId) {
    throw new Error("Stripe connected account not created");
  }

  const accountLink = await stripe.accountLinks.create({
    account: user.stripeAccountId,
    refresh_url: process.env.STRIPE_REFRESH_URL!,
    return_url: process.env.STRIPE_RETURN_URL!,
    type: "account_onboarding",
  });

  return {
    url: accountLink.url,
  };
};

export const checkStripeAccountStatusService = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) throw new Error("User not found");

  if (!user.stripeAccountId) {
    throw new Error("Stripe account not created");
  }

  const account = await stripe.accounts.retrieve(user.stripeAccountId);

  const detailsSubmitted = account.details_submitted;
  const chargesEnabled = account.charges_enabled;
  const payoutsEnabled = account.payouts_enabled;

  // If fully verified
  if (detailsSubmitted && chargesEnabled && payoutsEnabled) {
    user.isKycVerified = true;
    user.stripeOnboardingStatus = "COMPLETED";
    await user.save();
  }

  return {
    accountId: account.id,
    detailsSubmitted,
    chargesEnabled,
    payoutsEnabled,
    requirements: account.requirements,
    stripeOnboardingStatus: user.stripeOnboardingStatus,
    isKycVerified: user.isKycVerified,
  };
};

