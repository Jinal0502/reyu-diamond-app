import { NotificationService } from "../services/notification.service";
import logger from "../utils/logger";

/**
 * Business Logic Events for Notifications
 * Each function encapsulates the context for a specific action.
 */

// --- AUCTION & BIDS ---

export const notifyAuctionStarted = async (diamondName: string) => {
  return NotificationService.notifyAll({
    title: "Auction Started! 💎",
    body: `A new auction for "${diamondName}" has just gone live. Place your bids now!`,
    type: "AUCTION",
    data: { diamondName },
  });
};

export const notifyNewBid = async (recipientId: string, bidAmount: number, diamondName: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "New Bid Received!",
    body: `You received a new bid of $${bidAmount} on your ${diamondName}.`,
    type: "BID",
    data: { diamondName, bidAmount },
  });
};

export const notifyOutbid = async (recipientId: string, diamondName: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "You've been outbid!",
    body: `Someone placed a higher bid on ${diamondName}. Increase your bid to stay in the lead.`,
    type: "BID",
    data: { diamondName },
  });
};

export const notifyAuctionWon = async (recipientId: string, diamondName: string, dealId: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Auction Won! 🎉",
    body: `Congratulations! You won the auction for ${diamondName}. Click to complete the deal.`,
    type: "AUCTION",
    data: { diamondName, dealId },
  });
};

export const notifyAuctionEndedNoWinner = async (recipientId: string, diamondName: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Auction Ended (No Winner)",
    body: `Your auction for "${diamondName}" has ended without any bids. You can relist it from your inventory.`,
    type: "AUCTION",
    data: { diamondName },
  });
};

export const notifyAuctionClosedToBidders = async (recipientId: string, diamondName: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Auction Closed",
    body: `The auction for ${diamondName} has ended. Thanks for participating!`,
    type: "AUCTION",
    data: { diamondName },
  });
};

// --- DEALS & PAYMENTS ---

export const notifyDealCreated = async (recipientId: string, dealId: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "New Deal Created",
    body: `A new deal has been initiated for your transaction.`,
    type: "DEAL",
    data: { dealId },
  });
};

export const notifyPaymentReceived = async (recipientId: string, amount: number, dealId: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Payment Received",
    body: `Payment of $${amount} has been successfully processed for Deal #${dealId}.`,
    type: "PAYMENT",
    data: { dealId, amount },
  });
};

export const notifyEscrowReleased = async (recipientId: string, dealId: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Funds Released from Escrow",
    body: `The funds for Deal #${dealId} have been released to your account.`,
    type: "PAYMENT",
    data: { dealId },
  });
};

export const notifyDealShipped = async (recipientId: string, diamondName: string, dealId: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Diamond Shipped! 🚚",
    body: `Your diamond "${diamondName}" has been shipped. Track your package in the deal center.`,
    type: "DEAL",
    data: { dealId, diamondName },
  });
};

export const notifyDealDelivered = async (recipientId: string, diamondName: string, dealId: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Delivery Confirmed! ✅",
    body: `The delivery for "${diamondName}" has been confirmed. Escrow will be released shortly.`,
    type: "DEAL",
    data: { dealId, diamondName },
  });
};

export const notifyDealCancelled = async (recipientId: string, dealId: string, reason?: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Deal Cancelled",
    body: `Deal #${dealId} has been cancelled. ${reason || ""}`,
    type: "DEAL",
    data: { dealId },
  });
};

export const notifyDisputeRaised = async (recipientId: string, dealId: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Dispute Raised ⚠️",
    body: `A dispute has been raised for Deal #${dealId}. Admins will review the case.`,
    type: "DEAL",
    data: { dealId },
  });
};

export const notifyDisputeResolved = async (recipientId: string, dealId: string, resolution: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Dispute Resolved",
    body: `The dispute for Deal #${dealId} has been resolved: ${resolution}.`,
    type: "DEAL",
    data: { dealId, resolution },
  });
};

// --- CHAT ---

export const notifyChatMessage = async (recipientId: string, senderName: string, message: string, conversationId: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: `New message from ${senderName}`,
    body: message.length > 50 ? `${message.substring(0, 50)}...` : message,
    type: "CHAT",
    data: { conversationId, senderName },
  });
};

// --- KYC & PROFILE ---

export const notifyKycStatus = async (recipientId: string, status: "APPROVED" | "REJECTED", reason?: string) => {
  const isApproved = status === "APPROVED";
  return NotificationService.notifyUser({
    recipientId,
    title: isApproved ? "KYC Approved ✅" : "KYC Rejected ❌",
    body: isApproved
      ? "Your identity verification is complete. You can now start trading."
      : `Your KYC was rejected. ${reason || "Please check your documents and try again."}`,
    type: "KYC",
    data: { status, reason },
  });
};

export const notifyNewRating = async (recipientId: string, rating: number, raterName: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "New Rating Received! ⭐",
    body: `You received a ${rating}-star rating from ${raterName}.`,
    type: "RATING",
    data: { rating, raterName },
  });
};

export const notifyBadgeEarned = async (recipientId: string, badgeName: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "New Badge Earned! 🏆",
    body: `Congratulations! You've earned the "${badgeName}" badge.`,
    type: "SYSTEM",
    data: { badgeName },
  });
};

export const notifyRequirementMatched = async (recipientId: string, diamondName: string, requirementId: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "New Match Found! 💎",
    body: `A seller has matched your requirement for${diamondName}". Contact them now!`,
    type: "ADS",
    data: { requirementId, diamondName },
  });
};

// --- ADS ---

export const notifyAdStatusUpdate = async (recipientId: string, adTitle: string, status: string) => {
  return NotificationService.notifyUser({
    recipientId,
    title: "Advertisement Update",
    body: `Your ad "${adTitle}" status has been updated to: ${status}.`,
    type: "ADS",
    data: { adTitle, status },
  });
};

// --- ADMIN & SYSTEM ---

export const notifyKycSubmitted = async (userName: string, userId: string) => {
  return NotificationService.notifyAdmins({
    title: "New KYC Submission",
    body: `User ${userName} has submitted their KYC documents for review.`,
    type: "KYC",
    data: { userId, userName },
  });
};

export const notifyCriticalSystemError = async (errorDetails: string) => {
  return NotificationService.notifyAdmins({
    title: "CRITICAL: System Alert",
    body: `A critical system event requires attention: ${errorDetails}`,
    type: "SYSTEM",
    data: { severity: "CRITICAL" },
  });
};
