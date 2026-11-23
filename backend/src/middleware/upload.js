import multer from "multer";

import { HttpError } from "./errors.js";

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/** Memory storage: the image is re-encoded by sharp before anything touches disk. */
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 0 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new HttpError(400, "INVALID_FILE", "Use a JPG, PNG or WebP image."));
    }
    cb(null, true);
  },
}).single("avatar");
