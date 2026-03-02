import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary";
import path from "path";

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req: any, file) => {
    const inventoryId = req.params.inventoryId;

    if (!inventoryId) {
      throw new Error("Inventory ID is required");
    }

    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    if (!isImage && !isVideo) {
      throw new Error("Only image and video files are allowed");
    }

    const ext = path.extname(file.originalname).replace(".", "");
    const baseName = path.basename(
      file.originalname,
      path.extname(file.originalname)
    );

    // 👇 Filename-based preference (NOT restriction)
    const lowerName = baseName.toLowerCase();

    let folderType: "images" | "videos";

    if (lowerName.startsWith("video")) {
      folderType = "videos";
    } else if (lowerName.startsWith("img")) {
      folderType = "images";
    } else {
      // fallback to mimetype
      folderType = isVideo ? "videos" : "images";
    }

    return {
      folder: `inventory/${inventoryId}/${folderType}`,
      public_id: `${Date.now()}-${baseName}`,
      resource_type: "auto",
      format: ext,
    };
  },
});

export const inventoryUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 5 // 50MB
  },

  // ✅ ONLY mime-type validation (no filename restriction)
  fileFilter: (_req, file, cb) => {
    const allowed =
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/");

    if (!allowed) {
      cb(new Error("Only image and video files are allowed"));
    } else {
      cb(null, true);
    }
  },
});


