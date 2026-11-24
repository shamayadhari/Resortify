import bcrypt from "bcryptjs";

import { env } from "../config/env.js";
import { HttpError, parse } from "../middleware/errors.js";
import { signToken } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { schemas } from "../utils/validation.js";

// Compared against when the email isn't registered, so sign-in takes the same time either way.
let dummyHash;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("resortify-dummy-password", env.BCRYPT_COST));

const emailTaken = () =>
  new HttpError(409, "EMAIL_TAKEN", "An account with this email already exists. Try signing in instead.");

export async function register(req, res) {
  const { name, email, password, role } = parse(schemas.register, req.body);
  if (role !== undefined && role !== "citizen") {
    throw new HttpError(400, "ROLE_NOT_ALLOWED", "Only citizen accounts can sign up right now.");
  }
  if (await User.exists({ email })) throw emailTaken();

  try {
    await User.create({
      name,
      email,
      passwordHash: await bcrypt.hash(password, env.BCRYPT_COST),
      role: "citizen",
      status: "active",
    });
  } catch (err) {
    if (err?.code === 11000) throw emailTaken();
    throw err;
  }
  res.status(201).json({ message: "Account created. You can sign in now." });
}

export async function login(req, res) {
  const { email, password } = parse(schemas.login, req.body);
  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());
  if (!user || !ok) throw new HttpError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");

  if (user.status === "suspended") {
    throw new HttpError(403, "ACCOUNT_SUSPENDED", "This account has been suspended. Contact support for help.");
  }
  res.json({ token: signToken(user), user });
}

export function me(req, res) {
  res.json({ user: req.user });
}
