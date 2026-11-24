import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";

import sharp from "sharp";

import { startApi } from "./helpers.mjs";

let api;
const user = { name: "Asha Verma", email: "Asha@Example.com", password: "Passw0rdOne" };
let token;

before(async () => {
  api = await startApi();
});
after(async () => {
  await api.stop();
});

const errCode = (r) => r.json?.error?.code;

describe("health and errors", () => {
  it("GET /api/health is ok and reports the database", async () => {
    const r = await api.call("GET", "/api/health");
    assert.equal(r.status, 200);
    assert.deepEqual(r.json, { ok: true, db: "connected" });
  });
  it("unknown route returns the standard error shape", async () => {
    const r = await api.call("GET", "/api/nope");
    assert.equal(r.status, 404);
    assert.equal(errCode(r), "NOT_FOUND");
    assert.ok(r.json.error.message);
  });
  it("bad JSON is a 400, not a 500", async () => {
    const r = await api.call("POST", "/api/auth/login", { headers: { "Content-Type": "application/json" }, form: "{oops" });
    assert.equal(r.status, 400);
    assert.equal(errCode(r), "INVALID_JSON");
  });
  it("CORS preflight for PATCH with an Authorization header succeeds", async () => {
    const r = await api.call("OPTIONS", "/api/users/me", {
      headers: {
        Origin: "http://localhost:8080",
        "Access-Control-Request-Method": "PATCH",
        "Access-Control-Request-Headers": "authorization,content-type",
      },
    });
    assert.equal(r.status, 204);
    assert.match(r.headers.get("access-control-allow-methods"), /PATCH/);
    assert.match(r.headers.get("access-control-allow-headers"), /Authorization/i);
  });
  it("CORS: allows the interface origin, blocks others", async () => {
    const ok = await api.call("GET", "/api/health", { headers: { Origin: "http://localhost:8080" } });
    assert.equal(ok.headers.get("access-control-allow-origin"), "http://localhost:8080");
    const bad = await api.call("GET", "/api/health", { headers: { Origin: "https://evil.example" } });
    assert.equal(bad.status, 403);
    assert.equal(errCode(bad), "CORS_NOT_ALLOWED");
  });
});

describe("register and sign in", () => {
  it("rejects weak passwords and bad input", async () => {
    for (const password of ["short1", "allletterss", "12345678"]) {
      const r = await api.call("POST", "/api/auth/register", { body: { ...user, password, role: "citizen" } });
      assert.equal(r.status, 400, password);
      assert.equal(errCode(r), "VALIDATION_ERROR");
    }
    const r = await api.call("POST", "/api/auth/register", { body: { ...user, name: "A", role: "citizen" } });
    assert.equal(r.status, 400);
  });
  it("rejects any role but citizen", async () => {
    const r = await api.call("POST", "/api/auth/register", { body: { ...user, role: "admin" } });
    assert.equal(r.status, 400);
    assert.equal(errCode(r), "ROLE_NOT_ALLOWED");
  });
  it("creates an active account (email stored lowercase, password hashed)", async () => {
    const r = await api.call("POST", "/api/auth/register", { body: { ...user, role: "citizen" } });
    assert.equal(r.status, 201);
    assert.ok(r.json.message);
    const doc = await api.models.User.findOne({ email: "asha@example.com" }).select("+passwordHash");
    assert.ok(doc, "stored lowercase");
    assert.notEqual(doc.passwordHash, user.password);
    assert.equal(doc.status, "active");
    assert.equal(doc.role, "citizen");
  });
  it("409 EMAIL_TAKEN on a duplicate, whatever the case", async () => {
    const r = await api.call("POST", "/api/auth/register", { body: { ...user, email: "ASHA@example.com", role: "citizen" } });
    assert.equal(r.status, 409);
    assert.equal(errCode(r), "EMAIL_TAKEN");
  });
  it("wrong password and unknown email look identical (401)", async () => {
    const a = await api.call("POST", "/api/auth/login", { body: { email: user.email, password: "Wrong1234" } });
    const b = await api.call("POST", "/api/auth/login", { body: { email: "nobody@example.com", password: "Wrong1234" } });
    assert.equal(a.status, 401);
    assert.equal(b.status, 401);
    assert.equal(errCode(a), "INVALID_CREDENTIALS");
    assert.deepEqual(a.json, b.json);
  });
  it("the email verification and password-reset endpoints no longer exist", async () => {
    for (const path of ["verify-email", "resend-verification", "forgot-password", "reset-password"]) {
      const r = await api.call("POST", `/api/auth/${path}`, { body: { email: user.email, token: "x", password: "Passw0rdOne" } });
      assert.equal(r.status, 404, path);
    }
  });
});

describe("sign in and session", () => {
  it("login returns a token and a user with no secrets", async () => {
    const r = await api.call("POST", "/api/auth/login", { body: { email: "ASHA@example.com", password: user.password } });
    assert.equal(r.status, 200);
    token = r.json.token;
    assert.ok(token);
    assert.equal(r.json.user.email, "asha@example.com");
    assert.equal(r.json.user.role, "citizen");
    assert.equal(r.json.user.status, "active");
    assert.equal("emailVerified" in r.json.user, false);
    assert.equal("passwordHash" in r.json.user, false);
    assert.equal("passwordChangedAt" in r.json.user, false);
    assert.ok(r.json.user._id && r.json.user.createdAt);
  });
  it("/auth/me needs a valid bearer token", async () => {
    assert.equal((await api.call("GET", "/api/auth/me")).status, 401);
    assert.equal((await api.call("GET", "/api/auth/me", { token: "garbage" })).status, 401);
    const ok = await api.call("GET", "/api/auth/me", { token });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.user.name, "Asha Verma");
  });
});

describe("profile", () => {
  it("PATCH /users/me saves details and normalises the phone", async () => {
    const r = await api.call("PATCH", "/api/users/me", {
      token,
      body: { name: "Asha V", phone: "+91 98765 43210".replace(/ (?=\d{5} )/, " ").replace(/\s/g, ""), address: { line1: "12 MG Road", city: "Pune", state: "Maharashtra", pincode: "411001" } },
    });
    assert.equal(r.status, 200, r.raw);
    assert.equal(r.json.user.name, "Asha V");
    assert.equal(r.json.user.phone, "9876543210");
    assert.equal(r.json.user.address.pincode, "411001");
  });
  it("rejects a bad phone or PIN code", async () => {
    const a = await api.call("PATCH", "/api/users/me", { token, body: { name: "Asha V", phone: "12345", address: {} } });
    assert.equal(a.status, 400);
    const b = await api.call("PATCH", "/api/users/me", { token, body: { name: "Asha V", phone: "", address: { pincode: "012345" } } });
    assert.equal(b.status, 400);
  });
  it("empty phone and address clear the fields", async () => {
    const r = await api.call("PATCH", "/api/users/me", { token, body: { name: "Asha V", phone: "", address: { line1: "", city: "", state: "", pincode: "" } } });
    assert.equal(r.status, 200);
    assert.equal(r.json.user.phone, "");
  });
});

describe("avatar", () => {
  const png = () => sharp({ create: { width: 600, height: 400, channels: 3, background: "#2e8a63" } }).png().toBuffer();
  const formWith = (buf, type, name = "a.png") => {
    const f = new FormData();
    f.append("avatar", new Blob([buf], { type }), name);
    return f;
  };
  it("accepts a PNG, serves a 320px webp and removes the old file on replace", async () => {
    const r = await api.call("POST", "/api/users/me/avatar", { token, form: formWith(await png(), "image/png") });
    assert.equal(r.status, 200, r.raw);
    const url = r.json.user.avatarUrl;
    assert.match(url, /^\/uploads\/avatars\/.+\.webp$/);
    const img = await fetch(api.base + url);
    assert.equal(img.status, 200);
    assert.equal(img.headers.get("content-type"), "image/webp");
    assert.equal(img.headers.get("cross-origin-resource-policy"), "cross-origin");
    const meta = await sharp(Buffer.from(await img.arrayBuffer())).metadata();
    assert.equal(meta.width, 320);

    await new Promise((r) => setTimeout(r, 5));
    const r2 = await api.call("POST", "/api/users/me/avatar", { token, form: formWith(await png(), "image/png") });
    assert.notEqual(r2.json.user.avatarUrl, url);
    assert.equal((await fetch(api.base + url)).status, 404, "old avatar deleted");
  });
  it("rejects a non-image sent as image/png, a wrong type, and no file", async () => {
    const fake = await api.call("POST", "/api/users/me/avatar", { token, form: formWith(Buffer.from("<script>alert(1)</script>"), "image/png") });
    assert.equal(fake.status, 400);
    assert.equal(errCode(fake), "INVALID_FILE");
    const pdf = await api.call("POST", "/api/users/me/avatar", { token, form: formWith(Buffer.from("%PDF-1.4"), "application/pdf", "a.pdf") });
    assert.equal(pdf.status, 400);
    assert.equal(errCode(pdf), "INVALID_FILE");
    const none = await api.call("POST", "/api/users/me/avatar", { token, form: new FormData() });
    assert.equal(none.status, 400);
  });
  it("413 over 2 MB", async () => {
    const big = Buffer.alloc(2 * 1024 * 1024 + 10, 1);
    const r = await api.call("POST", "/api/users/me/avatar", { token, form: formWith(big, "image/png") });
    assert.equal(r.status, 413);
  });
  it("requires sign-in", async () => {
    const r = await api.call("POST", "/api/users/me/avatar", { form: formWith(await png(), "image/png") });
    assert.equal(r.status, 401);
  });
});

describe("change password", () => {
  it("400 WRONG_PASSWORD, then success; new password works, old does not", async () => {
    const wrong = await api.call("PATCH", "/api/users/me/password", { token, body: { currentPassword: "Nope12345", newPassword: "BrandNew123" } });
    assert.equal(wrong.status, 400);
    assert.equal(errCode(wrong), "WRONG_PASSWORD");
    const weak = await api.call("PATCH", "/api/users/me/password", { token, body: { currentPassword: user.password, newPassword: "weak" } });
    assert.equal(weak.status, 400);
    const ok = await api.call("PATCH", "/api/users/me/password", { token, body: { currentPassword: user.password, newPassword: "BrandNew123" } });
    assert.equal(ok.status, 200);
    assert.equal((await api.call("POST", "/api/auth/login", { body: { email: user.email, password: user.password } })).status, 401);
    const login = await api.call("POST", "/api/auth/login", { body: { email: user.email, password: "BrandNew123" } });
    assert.equal(login.status, 200);
    user.password = "BrandNew123";
    token = login.json.token;
  });
  it("the current session stays signed in after a password change", async () => {
    assert.equal((await api.call("GET", "/api/auth/me", { token })).status, 200);
  });
});

describe("suspended accounts", () => {
  it("cannot sign in, and an existing token stops working with ACCOUNT_SUSPENDED", async () => {
    await api.models.User.updateOne({ email: "asha@example.com" }, { status: "suspended" });
    const login = await api.call("POST", "/api/auth/login", { body: { email: user.email, password: user.password } });
    assert.equal(login.status, 403);
    assert.equal(errCode(login), "ACCOUNT_SUSPENDED");
    const me = await api.call("GET", "/api/auth/me", { token });
    assert.equal(me.status, 403);
    assert.equal(errCode(me), "ACCOUNT_SUSPENDED");
  });
});

describe("contact", () => {
  it("201 and saved in the database", async () => {
    const r = await api.call("POST", "/api/contact", { body: { name: "Ravi", email: "Ravi@Example.com", message: "Do you collect old laptops in Pune?" } });
    assert.equal(r.status, 201);
    const doc = await api.models.ContactMessage.findOne({ email: "ravi@example.com" });
    assert.ok(doc);
    assert.equal(doc.message, "Do you collect old laptops in Pune?");
  });
  it("400 on a too-short message", async () => {
    const r = await api.call("POST", "/api/contact", { body: { name: "Ravi", email: "ravi@example.com", message: "hi" } });
    assert.equal(r.status, 400);
    assert.equal(errCode(r), "VALIDATION_ERROR");
  });
});
