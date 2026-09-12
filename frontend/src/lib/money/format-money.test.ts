import { describe, it, expect } from "vitest";
import {
  formatMoney,
  formatMoneyFromPaise,
  rupeesToPaise,
  paiseToRupees,
} from "./format-money";

describe("formatMoney utility", () => {
  it("formats standard integer rupees correctly", () => {
    const formatted = formatMoney(500);
    expect(formatted).toContain("500");
    expect(formatted).toContain("₹");
  });

  it("converts paise smallest-units correctly when isSmallestUnit is true", () => {
    const formatted = formatMoney(50000, "INR", true);
    expect(formatted).toContain("500");
  });

  it("handles zero gracefully", () => {
    const formatted = formatMoney(0);
    expect(formatted).toContain("0");
  });

  it("formats thousands with Indian comma grouping", () => {
    const formatted = formatMoney(150000);
    expect(formatted).toContain("1,50,000");
  });

  it("formatMoneyFromPaise formats correctly", () => {
    const formatted = formatMoneyFromPaise(45000);
    expect(formatted).toContain("450");
  });
});

describe("rupeesToPaise conversion", () => {
  it("converts 1 rupee to 100 paise", () => {
    expect(rupeesToPaise(1)).toBe(100);
    expect(rupeesToPaise("1")).toBe(100);
  });

  it("converts 450 rupees to 45000 paise", () => {
    expect(rupeesToPaise(450)).toBe(45000);
    expect(rupeesToPaise("450")).toBe(45000);
  });

  it("converts 499.99 rupees to 49999 paise", () => {
    expect(rupeesToPaise(499.99)).toBe(49999);
    expect(rupeesToPaise("499.99")).toBe(49999);
  });

  it("rejects 0 or negative values", () => {
    expect(() => rupeesToPaise(0)).toThrow("Amount must be greater than 0");
    expect(() => rupeesToPaise(-50)).toThrow("Amount must be greater than 0");
  });

  it("rejects sub-paise (more than 2 decimal places)", () => {
    expect(() => rupeesToPaise(10.555)).toThrow("Maximum 2 decimal places");
  });

  it("rejects non-numeric inputs", () => {
    expect(() => rupeesToPaise("abc")).toThrow("Invalid rupee amount");
    expect(() => rupeesToPaise(NaN)).toThrow("Invalid rupee amount");
  });
});

describe("paiseToRupees conversion", () => {
  it("converts paise to rupees correctly", () => {
    expect(paiseToRupees(100)).toBe(1);
    expect(paiseToRupees(45000)).toBe(450);
    expect(paiseToRupees(49999)).toBe(499.99);
  });
});

