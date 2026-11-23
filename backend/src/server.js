import { createApp } from "./app.js";
import { connectDb, disconnectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { ContactMessage } from "./models/ContactMessage.js";
import { User } from "./models/User.js";

async function main() {
  await connectDb();

  // Make sure the unique indexes exist before taking traffic.
  await Promise.all([User.init(), ContactMessage.init()]).catch((err) =>
    console.warn("[db] index sync warning:", err.message),
  );

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    console.log(`[api] Resortify API listening on http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDb().catch(() => {});
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

process.on("unhandledRejection", (err) => console.error("[api] unhandled rejection:", err));

main().catch((err) => {
  console.error("[api] failed to start:", err.message);
  process.exit(1);
});
