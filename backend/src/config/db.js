import mongoose from "mongoose";

import { env } from "./env.js";

/** Hide the password in a connection string so it is safe to log. */
export function redactUri(uri) {
  return uri.replace(/\/\/([^:/@]+):([^@]+)@/, "//$1:***@");
}

mongoose.set("strictQuery", true);

export async function connectDb() {
  mongoose.connection.on("disconnected", () => console.warn("[db] disconnected from MongoDB"));
  mongoose.connection.on("reconnected", () => console.log("[db] reconnected to MongoDB"));
  mongoose.connection.on("error", (err) => console.error("[db] connection error:", err.message));

  try {
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10_000,
      maxPoolSize: 10,
    });
  } catch (err) {
    console.error(`\n[db] Could not connect to MongoDB at ${redactUri(env.MONGODB_URI)}`);
    console.error(`[db] ${err.message}`);
    console.error(
      "[db] Check that the URI is right, the user/password are correct, and (for Atlas) your IP is in Network Access.\n",
    );
    throw err;
  }

  const { host, name } = mongoose.connection;
  console.log(`[db] connected to MongoDB (${host}/${name})`);
  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export function dbState() {
  return ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState] ?? "unknown";
}
