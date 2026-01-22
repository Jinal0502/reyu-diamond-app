import cloudinary from "../config/cloudinary";

export const deleteKycFiles = async (userId: string): Promise<void> => {
  try {
    await cloudinary.api.delete_resources_by_prefix(`kyc/${userId}`, { resource_type: "image" });
    await cloudinary.api.delete_folder(`kyc/${userId}`);
  } catch (err: any) {
    console.error(`Failed to delete KYC files for user ${userId}:`, err.message);
    throw new Error("Failed to delete KYC files");
  }
};
