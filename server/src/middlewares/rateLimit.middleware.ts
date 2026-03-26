import rateLimit from "express-rate-limit";
import { sendResponse } from "../utils";

/* ================= GLOBAL API LIMIT ================= */

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse(
      res,
      429,
      false,
      "Too many requests. Please try again later."
    );
  },
});

/* ================= AUTH LIMIT (STRICTER) ================= */

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // Only 10 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse(
      res,
      429,
      false,
      "Too many login attempts. Please try again later."
    );
  },
});

/* ================= KYC LIMIT ================= */

export const kycLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Only 3 KYC submissions per user per 24 hours
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return sendResponse(
      res,
      429,
      false,
      "You have reached the maximum KYC submissions for today. Please try again tomorrow."
    );
  },
});

/* ================= USER LIMIT (PROFILE UPDATES) ================= */

export const userLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendResponse(res, 429, false, "Too many profile update attempts. Please try again later.");
  },
});

/* ================= BID LIMIT ================= */

export const bidLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendResponse(res, 429, false, "Too many bid attempts. Please try again later.");
  },
});

/* ================= INVENTORY LIMIT ================= */

export const inventoryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendResponse(res, 429, false, "Too many inventory management attempts. Please try again later.");
  },
});

/* ================= AD LIMIT ================= */

export const adLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendResponse(res, 429, false, "Too many advertisement requests. Please try again later.");
  },
});

/* ================= REQUIREMENT LIMIT ================= */

export const requirementLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    return sendResponse(res, 429, false, "Too many buying requirement submissions. Please try again later.");
  },
});