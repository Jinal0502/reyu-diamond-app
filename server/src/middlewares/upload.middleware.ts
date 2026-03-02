import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";

/* =========================
   KYC UPLOAD (Images Only)
========================= */

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png"];

const kycStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file) => {
    if (!req.user?._id) {
      throw new Error("User not authenticated");
    }

    return {
      folder: `kyc/${req.user._id}`,
      public_id: `${file.fieldname}_${Date.now()}`,
      resource_type: "image",
      allowed_formats: ["jpg", "jpeg", "png"],
    };
  },
});

export const kycUpload = multer({
  storage: kycStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    if (!allowedImageTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, JPEG, PNG files are allowed."));
    }
    cb(null, true);
  },
});


/* =========================
   ADS UPLOAD (Image + Video)
========================= */

const allowedAdTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "video/mp4",
];

const adsStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file) => {
    if (!req.user?._id) {
      throw new Error("User not authenticated");
    }

    return {
      folder: `ads/${req.user._id}`,
      public_id: `${file.fieldname}_${Date.now()}`,
      resource_type: "auto", // 🔥 auto detects image or video
    };
  },
});

export const adsUpload = multer({
  storage: adsStorage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB (for video support)
  fileFilter: (_req, file, cb) => {
    if (!allowedAdTypes.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, or MP4 files are allowed."));
    }
    cb(null, true);
  },
});