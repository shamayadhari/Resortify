import { describe, expect, it } from "vitest";

import { safeRedirect } from "./redirect";
import { hasDashboard, REGISTRABLE_ROLES } from "./roles";
import { passwordSchema, phoneSchema, pincodeSchema, validateAvatarFile } from "./validation";

describe("password rule: 8+ characters with a letter and a number", () => {
  it("accepts a valid password", () => {
    expect(passwordSchema.safeParse("green2026").success).toBe(true);
  });
  it("rejects 7 characters", () => {
    expect(passwordSchema.safeParse("abc1234").success).toBe(false);
  });
  it("rejects a password without a number", () => {
    expect(passwordSchema.safeParse("onlyletters").success).toBe(false);
  });
  it("rejects a password without a letter", () => {
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
  });
});

describe("Indian phone and PIN code", () => {
  it("accepts a 10-digit mobile starting 6-9, with or without +91", () => {
    expect(phoneSchema.safeParse("9876543210").success).toBe(true);
    expect(phoneSchema.safeParse("+91 9876543210").success).toBe(true);
  });
  it("rejects a mobile starting with 5", () => {
    expect(phoneSchema.safeParse("5876543210").success).toBe(false);
  });
  it("accepts a 6-digit PIN not starting with 0", () => {
    expect(pincodeSchema.safeParse("411001").success).toBe(true);
    expect(pincodeSchema.safeParse("011001").success).toBe(false);
  });
});

describe("avatar upload: JPG/PNG/WebP up to 2 MB", () => {
  const make = (type: string, size: number) => new File([new Uint8Array(size)], "a", { type });
  it("accepts a 2 MB PNG", () => {
    expect(validateAvatarFile(make("image/png", 2 * 1024 * 1024))).toBeNull();
  });
  it("rejects anything over 2 MB", () => {
    expect(validateAvatarFile(make("image/png", 2 * 1024 * 1024 + 1))).not.toBeNull();
  });
  it("rejects a GIF", () => {
    expect(validateAvatarFile(make("image/gif", 100))).not.toBeNull();
  });
});

describe("roles", () => {
  it("everyone but administrators can register, and every role has a dashboard", () => {
    expect(REGISTRABLE_ROLES).toContain("citizen");
    expect(REGISTRABLE_ROLES).toContain("recycler");
    expect(REGISTRABLE_ROLES).not.toContain("admin");
    for (const r of [
      "citizen",
      "scrap_dealer",
      "recycler",
      "collection_partner",
      "ngo",
      "organization",
      "admin",
    ]) {
      expect(hasDashboard(r)).toBe(true);
    }
    expect(hasDashboard("superuser")).toBe(false);
  });
});

describe("post-login redirect", () => {
  it("keeps same-site paths and blocks external URLs", () => {
    expect(safeRedirect("/profile")).toBe("/profile");
    expect(safeRedirect("//evil.com")).toBe("/dashboard");
    expect(safeRedirect("https://evil.com")).toBe("/dashboard");
  });
});
