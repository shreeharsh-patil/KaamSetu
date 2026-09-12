"use client";

import { useId, type ChangeEvent } from "react";
import { cn } from "@/lib/utils";
import { normalizeIndianPhone } from "@/features/auth/phone";

interface PhoneInputFieldProps {
  value: string; // 10 raw digits
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  helperText?: string;
}

export function formatPhoneDisplay(digits: string): string {
  const clean = digits.replace(/\D/g, "").slice(0, 10);
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)} ${clean.slice(5)}`;
}

export function PhoneInputField({
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
  label = "Mobile number",
  helperText = "We'll send a one-time code via SMS.",
}: PhoneInputFieldProps) {
  const inputId = useId();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = normalizeIndianPhone(e.target.value);
    onChange(raw);
  };

  return (
    <div className="space-y-1.5 w-full">
      <label
        htmlFor={inputId}
        className="block text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
      </label>

      <div
        className={cn(
          "flex items-center h-12 w-full rounded-xl border bg-white dark:bg-slate-900 shadow-2xs transition-colors",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          error
            ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
            : "border-slate-200 dark:border-slate-800",
          disabled && "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-950"
        )}
      >
        {/* Country code prefix */}
        <div className="flex items-center gap-1.5 px-3.5 border-r border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 select-none bg-slate-50/50 dark:bg-slate-800/40 h-full rounded-l-xl">
          <span className="text-base" role="img" aria-label="India flag">🇮🇳</span>
          <span>+91</span>
        </div>

        {/* Input */}
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          maxLength={16}
          placeholder="98765 43210"
          value={formatPhoneDisplay(value)}
          onChange={handleChange}
          autoFocus={autoFocus}
          disabled={disabled}
          autoComplete="tel-national"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-helper`}
          className="flex-1 h-full px-3.5 text-sm sm:text-base font-medium tracking-wide bg-transparent outline-none placeholder:text-slate-400 placeholder:font-normal text-slate-900 dark:text-white"
        />
      </div>

      {/* Minimized layout shift: reserved space or inline message */}
      <div className="min-h-[18px]">
        {error ? (
          <p id={`${inputId}-error`} className="text-xs font-medium text-destructive">
            {error}
          </p>
        ) : (
          <p id={`${inputId}-helper`} className="text-[11px] text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
}
