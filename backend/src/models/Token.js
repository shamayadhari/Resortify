import mongoose from "mongoose";

export const TOKEN_TTL_MS = { verify: 24 * 60 * 60 * 1000, reset: 60 * 60 * 1000 };

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ["verify", "reset"], required: true },
    // Only the SHA-256 of the emailed token is stored.
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date },
    // Records are kept a week past expiry so "expired" and "already used" can be told apart, then removed.
    purgeAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: true },
);

export const Token = mongoose.models.Token ?? mongoose.model("Token", schema);
