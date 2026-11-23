import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { HttpError } from "./errors.js";

export function signToken(user) {
  return jwt.sign({ sub: String(user._id) }, env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw new HttpError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
  } catch {
    throw new HttpError(401, "INVALID_TOKEN", "Your session has expired. Please sign in again.");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, "INVALID_TOKEN", "Your session has expired. Please sign in again.");

  // Anything that sets passwordChangedAt (e.g. re-running the seed script) signs out older sessions.
  if (user.passwordChangedAt && payload.iat < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
    throw new HttpError(401, "INVALID_TOKEN", "Your password changed. Please sign in again.");
  }
  if (user.status === "suspended") {
    throw new HttpError(403, "ACCOUNT_SUSPENDED", "This account has been suspended. Contact support for help.");
  }

  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      throw new HttpError(403, "FORBIDDEN", "You don't have access to that.");
    }
    next();
  };
}
