import fs from "node:fs/promises";
import path from "node:path";

import bcrypt from "bcryptjs";
import sharp from "sharp";

import { env } from "../config/env.js";
import { AVATAR_DIR } from "../config/paths.js";
import { HttpError, parse } from "../middleware/errors.js";
import { User } from "../models/User.js";
import { schemas } from "../utils/validation.js";

export async function updateMe(req, res) {
  const { name, phone, address } = parse(schemas.profile, req.body);
  req.user.name = name;
  req.user.phone = phone;
  req.user.address = address;
  await req.user.save();
  res.json({ user: req.user });
}

export async function uploadAvatar(req, res) {
  if (!req.file) throw new HttpError(400, "INVALID_FILE", "Choose a JPG, PNG or WebP image to upload.");

  let webp;
  try {
    // Re-encoding drops metadata and proves the bytes really are an image, whatever the client claimed.
    webp = await sharp(req.file.buffer, { limitInputPixels: 24_000_000 })
      .rotate()
      .resize(320, 320, { fit: "cover" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new HttpError(400, "INVALID_FILE", "That file isn't a readable image. Use a JPG, PNG or WebP.");
  }

  await fs.mkdir(AVATAR_DIR, { recursive: true });
  const filename = `${req.user._id}-${Date.now()}.webp`;
  await fs.writeFile(path.join(AVATAR_DIR, filename), webp);

  const previous = req.user.avatarUrl;
  req.user.avatarUrl = `/uploads/avatars/${filename}`;
  await req.user.save();

  if (previous?.startsWith("/uploads/avatars/")) {
    // basename() keeps a stored value from ever pointing outside the avatar folder.
    await fs.rm(path.join(AVATAR_DIR, path.basename(previous)), { force: true }).catch(() => {});
  }
  res.json({ user: req.user });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = parse(schemas.changePassword, req.body);
  const user = await User.findById(req.user._id).select("+passwordHash");

  if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
    throw new HttpError(400, "WRONG_PASSWORD", "Your current password is incorrect.");
  }
  if (currentPassword === newPassword) {
    throw new HttpError(400, "VALIDATION_ERROR", "Choose a password different from your current one.");
  }
  user.passwordHash = await bcrypt.hash(newPassword, env.BCRYPT_COST);
  await user.save();
  res.json({ message: "Password changed." });
}
