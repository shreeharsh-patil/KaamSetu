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
