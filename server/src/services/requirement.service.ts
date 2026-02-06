import { Requirement, IRequirement } from "../models/Requirement.model";
import { Types } from "mongoose";

// Create a new preference requirement
export const createRequirement = async (data: Partial<IRequirement>) => {
  if (!data.userId || !data.intent || !data.constraints) {
    throw new Error("Invalid data");
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
    throw new Error("Duplicate requirement exists");
  }

  return Requirement.create({ ...data, userId });
};

// Get all preferences for a user
export const getRequirementsByUser = async (userId: string) => {
  return Requirement.find({ userId: new Types.ObjectId(userId) }).sort({
    createdAt: -1,
  });
};

// Get a single requirement by ID
export const getRequirementById = async (requirementId: string) => {
  if (!Types.ObjectId.isValid(requirementId)) return null;
  return Requirement.findById(requirementId);
};

// Update a requirement
export const updateRequirement = async (
  requirementId: string,
  data: Partial<IRequirement>
) => {
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) throw new Error("Requirement not found");

  return Requirement.findByIdAndUpdate(requirement._id, data, { new: true });
};

// Delete a requirement
export const deleteRequirement = async (requirementId: string) => {
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) throw new Error("Requirement not found");

  return Requirement.findByIdAndDelete(requirement._id);
};
