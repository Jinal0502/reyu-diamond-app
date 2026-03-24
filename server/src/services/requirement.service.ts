import { Requirement, IRequirement } from "../models/Requirement.model";
import { Types } from "mongoose";
import { CustomError, ErrorCode, HTTP_STATUS } from "../utils";
import logger from "../utils/logger";
import * as NotificationEvents from "../notifications/events";
import { Inventory } from "../models/Inventory.model";

// Create a new preference requirement
export const createRequirement = async (data: Partial<IRequirement>) => {
  if (!data.userId || !data.intent || !data.constraints) {
    throw new CustomError("Invalid data", HTTP_STATUS.BAD_REQUEST, ErrorCode.VALIDATION_ERROR);
  }

  const userId = new Types.ObjectId(data.userId);

  // Optional: check for duplicate intent/preferences for the same user
  const existing = await Requirement.findOne({
    userId,
    "intent.shape": { $all: data.intent.shape },
    "intent.color": { $all: data.intent.color },
    "intent.clarity": { $all: data.intent.clarity },
    "intent.lab": data.intent.lab,
    "constraints.location": { $all: data.constraints.location },
    "constraints.budget": data.constraints.budget,
    "constraints.currency": data.constraints.currency,
  });

  if (existing) {
    throw new CustomError("Duplicate requirement exists", HTTP_STATUS.CONFLICT, ErrorCode.REQUIREMENT_DUPLICATE);
  }

  const requirement = await Requirement.create({ ...data, userId });
  logger.info("Requirement created", { requirementId: requirement._id, userId });

  // 🔥 Matching Logic (Async)
  const findMatchesAndNotify = async () => {
    try {
      const { intent, constraints } = requirement;

      const matches = await Inventory.find({
        status: "available",
        locked: false, // skip locked inventory
        sellerId: { $ne: userId },
        shape: { $in: intent.shape.map((s: string) => s.toUpperCase()) },
        color: { $in: intent.color.map((c: string) => c.toUpperCase()) },
        clarity: { $in: intent.clarity.map((c: string) => c.toUpperCase()) },
        carat: { $gte: Number(intent.carat.min), $lte: Number(intent.carat.max) },
        location: { $in: constraints.location },
        price: { $lte: Number(constraints.budget) },
        lab: intent.lab ? { $in: intent.labName } : { $exists: true },
      })
        .select("sellerId title")
        .limit(10); // Limit to 10 for performance

      logger.info("Matching inventory found", { matchesCount: matches.length });

      for (const inv of matches) {
        await NotificationEvents.notifyRequirementMatched(
          inv.sellerId.toString(),
          inv.title,
          requirement._id.toString()
        );
      }

      logger.info("Notifications sent for requirement", { requirementId: requirement._id });

    } catch (err) {
      logger.error("Error matching requirements", err);
    }
  };

  // Run async, no need to block response
  findMatchesAndNotify();

  return requirement;
};

export const getRequirementsByUser = async (userId: string) => {
  return Requirement.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 });
};

export const getRequirementById = async (requirementId: string) => {
  if (!Types.ObjectId.isValid(requirementId)) return null;
  return Requirement.findById(requirementId);
};

export const updateRequirement = async (requirementId: string, data: any) => {
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) {
    throw new CustomError("Requirement not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  // 🔥 Flatten nested objects to prevent data loss (Atomic Updates)
  const updateSet: any = {};
  const updateAdd: any = {};
  const nesteds = ["intent", "constraints", "preferences"];

  nesteds.forEach((section) => {
    if (data[section] && typeof data[section] === "object") {
      Object.keys(data[section]).forEach((key) => {
        const val = data[section][key];
        const path = `${section}.${key}`;

        if (Array.isArray(val)) {
          // If it's an array (like shape, color), use $addToSet to merge uniquely
          updateAdd[path] = { $each: val };
        } else {
          // Otherwise use $set to overwrite
          updateSet[path] = val;
        }
      });
    }
  });

  // Copy top-level fields
  Object.keys(data).forEach((key) => {
    if (!nesteds.includes(key)) {
      updateSet[key] = data[key];
    }
  });

  // Prepare the update object
  const updateOp: any = { $set: updateSet };
  if (Object.keys(updateAdd).length > 0) {
    updateOp.$addToSet = updateAdd;
  }

  return Requirement.findByIdAndUpdate(requirement._id, updateOp, { new: true });
};

export const deleteRequirement = async (requirementId: string) => {
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) {
    throw new CustomError("Requirement not found", HTTP_STATUS.NOT_FOUND, ErrorCode.NOT_FOUND);
  }

  logger.info("Requirement deleted", { requirementId });
  return Requirement.findByIdAndDelete(requirement._id);
};
