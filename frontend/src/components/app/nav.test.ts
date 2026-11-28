import { describe, expect, it } from "vitest";

import { ROLES } from "@/lib/roles";

import { NAV } from "./AppShell";

describe("role navigation", () => {
  it("gives every role a dashboard link and a profile link", () => {
    for (const role of ROLES) {
      const links = NAV[role].map((n) => n.to);
      expect(links[0]).toBe("/dashboard");
      expect(links).toContain("/profile");
    }
  });

  it("has no duplicate links within a role", () => {
    for (const role of ROLES) {
      const links = NAV[role].map((n) => n.to);
      expect(new Set(links).size).toBe(links.length);
    }
  });

  it("keeps tools with their role: only collectors see pickup jobs, only admins see admin pages", () => {
    expect(NAV.admin.some((n) => n.to.startsWith("/admin"))).toBe(true);
    for (const role of ROLES.filter((r) => r !== "admin"))
      expect(NAV[role].some((n) => n.to.startsWith("/admin"))).toBe(false);
    expect(NAV.recycler.some((n) => n.to === "/recycler")).toBe(true);
    expect(NAV.citizen.some((n) => n.to === "/recycler")).toBe(false);
  });
});
