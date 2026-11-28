import cors from "cors";
import express from "express";
import helmet from "helmet";

import { env } from "./config/env.js";
import { UPLOAD_DIR } from "./config/paths.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import routes from "./routes/index.js";

function originMatcher(list) {
  const exact = new Set(list.filter((o) => !o.includes("*")));
  const patterns = list
    .filter((o) => o.includes("*"))
    .map((o) => new RegExp("^" + o.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[a-z0-9-]+") + "$", "i"));
  return (origin) => exact.has(origin) || patterns.some((re) => re.test(origin));
}

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);

  // The interface runs on another origin and loads avatars from /uploads, so images must be cross-origin readable.
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

  const allowed = originMatcher(env.corsOrigins);
  app.use(
    cors({
      origin(origin, cb) {
        // No Origin header = curl, health checks, server-to-server.
        if (!origin || allowed(origin)) return cb(null, true);
        cb(new Error("CORS_NOT_ALLOWED"));
      },
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
      maxAge: 86400,
    }),
  );

  app.use(express.json({ limit: "50kb" }));
  app.use("/uploads", express.static(UPLOAD_DIR, { index: false, dotfiles: "deny", maxAge: "7d" }));
  app.use("/api", routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
