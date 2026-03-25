import { stripe } from "../config/stripe";
import { User } from "../models/User.model";
import { CustomError, ErrorCode, HTTP_STATUS } from "../utils";
import logger from "../utils/logger";

export const createStripeConnectedAccountService = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  if (user.stripeAccountId) {
    return { alreadyExists: true, accountId: user.stripeAccountId };
  }

  const account = await stripe.accounts.create({
    type: "express",
    country: "US",
    email: user.email,
    capabilities: { transfers: { requested: true } },
  });

  user.stripeAccountId = account.id;
  user.stripeOnboardingStatus = "PENDING";
  await user.save();

  logger.info("Stripe connected account created", { userId, accountId: account.id });

  return { alreadyExists: false, accountId: account.id };
};

export const generateOnboardingLinkService = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  if (!user.stripeAccountId) {
    throw new CustomError("Stripe connected account not created", HTTP_STATUS.BAD_REQUEST, ErrorCode.STRIPE_ACCOUNT_NOT_CREATED);
  }

  const accountLink = await stripe.accountLinks.create({
    account: user.stripeAccountId,
    refresh_url: process.env.STRIPE_REFRESH_URL!,
    return_url: process.env.STRIPE_RETURN_URL!,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
};

export const checkStripeAccountStatusService = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new CustomError("User not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  if (!user.stripeAccountId) {
    throw new CustomError("Stripe account not created", HTTP_STATUS.BAD_REQUEST, ErrorCode.STRIPE_ACCOUNT_NOT_CREATED);
  }

  const account = await stripe.accounts.retrieve(user.stripeAccountId);

  const { details_submitted: detailsSubmitted, charges_enabled: chargesEnabled, payouts_enabled: payoutsEnabled } = account;

  if (detailsSubmitted && chargesEnabled && payoutsEnabled) {
    user.isKycVerified = true;
    user.stripeOnboardingStatus = "COMPLETED";
    await user.save();
    logger.info("Stripe account fully verified", { userId, accountId: account.id });
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
