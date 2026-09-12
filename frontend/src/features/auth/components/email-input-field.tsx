"use client";

import { useId, type ChangeEvent } from "react";
import { Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmailInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  disabled?: boolean;
  autoFocus?: boolean;
  label?: string;
  helperText?: string;
}

export function EmailInputField({
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
  label = "Email address",
  helperText = "We'll send a verification code to your registered mobile number.",
}: EmailInputFieldProps) {
  const inputId = useId();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
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
          "relative flex items-center h-12 w-full rounded-xl border bg-white dark:bg-slate-900 shadow-2xs transition-colors",
          "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
          error
            ? "border-destructive focus-within:border-destructive focus-within:ring-destructive/20"
            : "border-slate-200 dark:border-slate-800",
          disabled && "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-950"
        )}
      >
        <div className="pointer-events-none absolute left-3.5 flex items-center text-slate-400">
          <Mail className="h-4 w-4" />
        </div>

        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="name@example.com"
          value={value}
          onChange={handleChange}
          autoFocus={autoFocus}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : `${inputId}-helper`}
          className="flex-1 h-full pl-10 pr-3.5 text-sm sm:text-base font-normal bg-transparent outline-none placeholder:text-slate-400 text-slate-900 dark:text-white"
        />
      </div>

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
