import { Requirement , IRequirement } from "../models/Requirement.model";
import {Types} from "mongoose";

const expireRequirements = async () => {

  const now = new Date();
  await Requirement.updateMany(
    {status : "active" , "constraints.deadline" : {$lt: now}},
    {status : "expired"}
  );
};

export const createRequirement = async (data : Partial<IRequirement>) => {

  if(!data.userId || !data.intent || !data.constraints){

    throw new Error("Invalid data");
  }
  const userId = new Types.ObjectId(data.userId);

  await expireRequirements();

  const existing = await Requirement.findOne({
    userId,
    status: "active",
    "intent.shape": { $all: data.intent.shape },
    "intent.color": { $all: data.intent.color },
    "intent.clarity": { $all: data.intent.clarity },
    "intent.lab": data.intent.lab,
    "constraints.location": { $all: data.constraints.location },
    "constraints.budget": data.constraints.budget,
    "constraints.currency": data.constraints.currency,
  });

  if(existing) {
    throw new Error("Duplicate active requirement exists");
  }

  return Requirement.create({ ...data , userId , status: "active"});
};

export const getRequirementsByUser = async(
  userId : string,
  status?: "active" | "close" | "expired"
) =>{

  await expireRequirements();

  const query : any = {userId : new Types.ObjectId(userId)};

  if(status) {
    query.status = status;
  }

  return Requirement.find(query).sort({createdAt : -1});
};

export const getRequirementById = async(requirementId : string) => {

  if(!Types.ObjectId.isValid(requirementId)) return null;

  return Requirement.findById(requirementId);
}

export const updateRequirement = async(
  requirementId : string,
  data : Partial<IRequirement>
) => {
  const requirement = await Requirement.findById(requirementId);

  if(!requirement) throw new Error("Requirement not found");

  if(requirement.status !== "active"){

    throw new Error("Cannot update closed or expired requirement");
  }

  return Requirement.findByIdAndUpdate(requirement._id , data , {new : true});
}

export const deleteRequirement = async(requirementId : string) => {
  
  const requirement = await Requirement.findById(requirementId);

  if(!requirement) throw new Error("Requirement not found");

  if(requirement.status === "close"){

    throw new Error("Cannot delete closed requirement");
  }

  return Requirement.findByIdAndDelete(requirement._id);

}