import { Requirement, IRequirement } from "../models/Requirement.model";
import { Types } from "mongoose";

export const createRequirement = async (data: Partial<IRequirement>) => {
  if (!data.userId || !data.intent || !data.constraints) {
    throw new Error("Invalid data");
  }

  const userId = new Types.ObjectId(data.userId);

  const existing = await Requirement.findOne({
    userId,
    "intent.shape": { $all: data.intent.shape },
    "intent.color": { $all: data.intent.color },
    "intent.clarity": { $all: data.intent.clarity },
    "intent.lab": data.intent.lab,
    "constraints.location": { $all: data.constraints.location },
    "constraints.budget": data.constraints.budget,
    "constraints.currency": data.constraints.currency,
    "constraints.deadline": { $gt: new Date() },
  });

  if (existing) {
    throw new Error("Duplicate active requirement exists");
  }

  return Requirement.create({ ...data, userId });
};

export const getActiveRequirementsByUser = async (userId: string) => {
  return Requirement.find({
    userId: new Types.ObjectId(userId),
    "constraints.deadline": { $gt: new Date() },
  }).sort({ createdAt: -1 });
};

export const getRequirementById = async (requirementId: string) => {
  if (!Types.ObjectId.isValid(requirementId)) return null;
  return Requirement.findById(requirementId);
};

export const updateRequirement = async (
  requirementId: string,
  data: Partial<IRequirement>
) => {
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) throw new Error("Requirement not found");

  if (requirement.constraints.deadline < new Date()) {
    throw new Error("Cannot update expired requirement");
  }

  return Requirement.findByIdAndUpdate(requirement._id, data, { new: true });
};

export const deleteRequirement = async (requirementId: string) => {
  const requirement = await Requirement.findById(requirementId);
  if (!requirement) throw new Error("Requirement not found");

  return Requirement.findByIdAndDelete(requirement._id);
};
