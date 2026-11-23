import crypto from "node:crypto";

/** A random URL-safe token for emails. Only its hash is stored. */
export function newToken() {
  const raw = crypto.randomBytes(32).toString("base64url");
  return { raw, hash: hashToken(raw) };
}

export function hashToken(raw) {
  return crypto.createHash("sha256").update(String(raw)).digest("hex");
}
