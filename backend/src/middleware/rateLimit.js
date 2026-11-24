import { rateLimit } from "express-rate-limit";

import { env } from "../config/env.js";

/** Strict limiter for sign-up, sign-in, token and contact endpoints (not /auth/me). */
export const sensitiveLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.RATE_LIMIT_MAX,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.isTest && env.RATE_LIMIT_MAX >= 1000,
  handler: (req, res) =>
    res.status(429).json({
      error: { code: "RATE_LIMITED", message: "Too many attempts. Please wait a few minutes and try again.", details: {} },
    }),
});
