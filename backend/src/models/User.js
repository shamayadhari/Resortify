import mongoose from "mongoose";

export const ROLES = ["citizen", "scrap_dealer", "recycler", "collection_partner", "ngo", "organization", "admin"];
export const STATUSES = ["active", "suspended"];

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "citizen", index: true },
    phone: { type: String, trim: true, default: "" },
    address: {
      line1: { type: String, trim: true, default: "" },
      city: { type: String, trim: true, default: "" },
      state: { type: String, trim: true, default: "" },
      pincode: { type: String, trim: true, default: "" },
    },
    avatarUrl: { type: String, default: "" },
    status: { type: String, enum: STATUSES, default: "active" },
    partnerVerified: { type: Boolean, default: false },
    passwordChangedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: false,
      versionKey: false,
      // Never leak secrets, whatever a controller forgets to strip.
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.passwordChangedAt;
        return ret;
      },
    },
  },
);

export const User = mongoose.models.User ?? mongoose.model("User", schema);
