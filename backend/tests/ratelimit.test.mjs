// Own file so it runs in its own process with a low limit.
process.env.RATE_LIMIT_MAX = "3";
import assert from "node:assert/strict";
import { after, before, it } from "node:test";

import { startApi } from "./helpers.mjs";

let api;
before(async () => {
  api = await startApi();
});
after(async () => {
  await api.stop();
});

it("returns 429 RATE_LIMITED after too many attempts, but never limits /auth/me or /health", async () => {
  const body = { email: "x@example.com", password: "Whatever123" };
  const codes = [];
  for (let i = 0; i < 5; i++) codes.push((await api.call("POST", "/api/auth/login", { body })).status);
  assert.deepEqual(codes, [401, 401, 401, 429, 429]);
  const limited = await api.call("POST", "/api/auth/login", { body });
  assert.equal(limited.json.error.code, "RATE_LIMITED");
  for (let i = 0; i < 8; i++) assert.equal((await api.call("GET", "/api/health")).status, 200);
  for (let i = 0; i < 8; i++) assert.equal((await api.call("GET", "/api/auth/me")).status, 401);
});
