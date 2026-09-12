/**
 * Converts rupees (number or string representation) into positive integer paise.
 * Throws an Error if the input is not a positive finite number or has more than 2 decimal places.
 */
export function rupeesToPaise(rupees: number | string): number {
  const normalized = typeof rupees === "string" ? rupees.trim() : rupees;
  const num = typeof normalized === "string" ? Number(normalized) : normalized;

  if (typeof num !== "number" || Number.isNaN(num) || !Number.isFinite(num)) {
    throw new Error("Invalid rupee amount: must be a finite number");
  }

  if (num <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  // Check decimal precision (no fractional paise allowed, max 2 decimals)
  const str = String(normalized);
  const parts = str.split(".");
  const decimalPart = parts[1];
  if (decimalPart && decimalPart.length > 2) {
    throw new Error("Maximum 2 decimal places allowed (sub-paise not permitted)");
  }

  return Math.round(num * 100);
}

/**
 * Converts integer paise to rupees (floating decimal).
 */
export function paiseToRupees(paise: number): number {
  if (typeof paise !== "number" || Number.isNaN(paise) || !Number.isFinite(paise)) {
    return 0;
  }
  return paise / 100;
}

/**
 * Formats an amount in integer currency (or decimal) into a locale-aware Indian Rupee representation.
 * Backend totals are always authoritative.
 *
 * @param amount Amount in rupees (or smallest unit if isSmallestUnit = true)
 * @param currency Currency code (default: INR)
 * @param isSmallestUnit Whether the amount is passed in paise (1 INR = 100 paise)
 */
export function formatMoney(
  amount: number,
  currency: string = "INR",
  isSmallestUnit: boolean = false
): string {
  const value = isSmallestUnit ? amount / 100 : amount;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Helper to format directly from integer paise.
 */
export function formatMoneyFromPaise(paise: number, currency: string = "INR"): string {
  return formatMoney(paise, currency, true);
}

