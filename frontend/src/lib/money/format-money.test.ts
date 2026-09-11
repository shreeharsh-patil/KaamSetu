import { describe, it, expect } from "vitest";
import { formatMoney } from "./format-money";

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
});
