import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file) => {
    if (!req.user?._id) throw new Error("User not authenticated");

    const userId = req.user._id.toString();

    // Reject any non-image
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
      throw new Error("Only JPG, JPEG, PNG files are allowed.");
    }

    return {
      folder: `kyc/${userId}`,
      public_id: file.fieldname,
      allowed_formats: ["jpg", "jpeg", "png"],
      resource_type: "image",
    };
  },
});

export const kycUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.mimetype)) {
      cb(new Error("Only JPG, JPEG, PNG files are allowed."));
    } else {
      cb(null, true);
    }
  },
});
