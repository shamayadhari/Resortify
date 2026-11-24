// Creates (or updates) an admin account.
// Usage:  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='Str0ngPass1' npm run seed
import bcrypt from "bcryptjs";

import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { User } from "./models/User.js";
import { emailSchema, passwordSchema } from "./utils/validation.js";

const email = emailSchema.safeParse(process.env.ADMIN_EMAIL ?? "");
const password = passwordSchema.safeParse(process.env.ADMIN_PASSWORD ?? "");
if (!email.success || !password.success) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ chars, a letter and a number), e.g.:");
  console.error("  ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='Str0ngPass1' npm run seed");
  process.exit(1);
}

await connectDb();
await User.init();
const passwordHash = await bcrypt.hash(password.data, env.BCRYPT_COST);
const admin = (await User.findOne({ email: email.data })) ?? new User({ email: email.data, name: "Resortify Admin" });
admin.set({ role: "admin", status: "active", passwordHash, passwordChangedAt: new Date() });
await admin.save();
console.log(`Admin ready: ${email.data}`);
await disconnectDb();
