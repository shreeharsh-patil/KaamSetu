import { describe, it, expect } from "vitest";
import { translations } from "./translations";
import { SUPPORTED_LOCALES } from "./types";

describe("i18n translation dictionaries", () => {
  it("contains all 4 supported locales", () => {
    const localeCodes = SUPPORTED_LOCALES.map((l) => l.code);
    expect(localeCodes).toEqual(["en", "hi", "mr", "kok"]);
  });

  it("ensures critical keys exist across all languages", () => {
    const criticalKeys = [
      "nav.home",
      "nav.jobs",
      "nav.profile",
      "action.continue",
      "action.cancel",
      "customer.findWorkers",
      "customer.startOtp",
      "worker.available",
      "category.plumbing",
      "status.COMPLETED",
    ];

    for (const locale of ["en", "hi", "mr", "kok"] as const) {
      const dict = translations[locale];
      expect(dict).toBeDefined();
      if (dict) {
        for (const key of criticalKeys) {
          const val = dict[key];
          expect(val, `Missing key "${key}" in locale "${locale}"`).toBeDefined();
          expect(val?.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
