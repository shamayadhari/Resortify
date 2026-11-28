import { describe, expect, it } from "vitest";

import { inr, inrRange, kg, nameOf, idOf, PICKUP_STATUS, ITEM_STATUS } from "./format";

describe("format helpers", () => {
  it("formats rupees in Indian grouping and handles missing values", () => {
    expect(inr(1234567)).toBe("₹12,34,567");
    expect(inr(null)).toBe("—");
    expect(inrRange({ min: 100, max: 250 })).toBe("₹100 – ₹250");
    expect(inrRange({ min: 0, max: 0 })).toBe("₹0");
  });
  it("formats weights without float noise", () => {
    expect(kg(2.4000000001)).toBe("2.4 kg");
    expect(kg(undefined)).toBe("—");
  });
  it("reads populated or plain ids and names", () => {
    expect(idOf("abc")).toBe("abc");
    expect(idOf({ _id: "x" })).toBe("x");
    expect(nameOf({ name: "Asha" })).toBe("Asha");
    expect(nameOf("id-only")).toBe("");
  });
  it("labels every pickup and item status", () => {
    expect(Object.keys(PICKUP_STATUS)).toHaveLength(6);
    expect(ITEM_STATUS.processed.tone).toBe("success");
  });
});
