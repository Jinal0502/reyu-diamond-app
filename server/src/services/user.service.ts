import { User } from "../models/User.model";

export const getUserProfile = async (userId: string) => {
  const user = await User.findById(userId)

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    isKycVerified: user.isKycVerified,
  };
};

export const updateUserProfile = async (
  userId: string,
  payload: { name?: string }
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  if (payload.name) {
    user.name = payload.name;
  }

  await user.save();

  return {
    id: user._id,
    name: user.name,
    email: user.email,
  };
};
