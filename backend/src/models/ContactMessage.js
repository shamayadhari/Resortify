import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 254 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    ip: { type: String },
    handled: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ContactMessage = mongoose.models.ContactMessage ?? mongoose.model("ContactMessage", schema);
