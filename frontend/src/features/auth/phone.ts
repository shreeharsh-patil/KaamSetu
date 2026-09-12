export function normalizeIndianPhone(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function isValidIndianPhone(value: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeIndianPhone(value));
}

export function toIndianE164(value: string): string {
  return `+91${normalizeIndianPhone(value)}`;
}
