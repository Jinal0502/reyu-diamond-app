import cloudinary from "../config/cloudinary";

export const deleteSingleFile = async (
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
): Promise<void> => {
  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
};


export const deleteFolderByPrefix = async (prefix: string): Promise<void> => {
  // delete all images
  await cloudinary.api.delete_resources_by_prefix(prefix, {
    resource_type: "image",
  });

  // delete all videos
  await cloudinary.api.delete_resources_by_prefix(prefix, {
    resource_type: "video",
  });

  // delete all raw
  await cloudinary.api.delete_resources_by_prefix(prefix, {
    resource_type: "raw",
  });

  // delete folder (ignore 404)
  try {
    await cloudinary.api.delete_folder(prefix);
  } catch (err: any) {
    if (err?.error?.http_code !== 404) throw err;
  }
};
