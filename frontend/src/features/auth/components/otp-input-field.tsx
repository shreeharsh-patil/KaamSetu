"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";

interface OtpInputFieldProps {
  value: string[]; // array of 6 strings
  onChange: (digits: string[]) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
  error?: boolean;
  length?: number;
}

export function OtpInputField({
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  length = 6,
}: OtpInputFieldProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleDigitChange = (index: number, val: string) => {
    const cleaned = val.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...value];
      next[index] = "";
      onChange(next);
      return;
    }

    const digit = cleaned.slice(-1);
    const next = [...value];
    next[index] = digit;
    onChange(next);

    // Auto-advance
    if (index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else {
      const full = next.join("");
      if (full.length === length && onComplete) {
        onComplete(full);
      }
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    if (!pasted) return;

    const next = [...value];
    for (let i = 0; i < length; i++) {
      next[i] = pasted[i] || "";
    }
    onChange(next);

    const focusIdx = Math.min(pasted.length, length - 1);
    inputRefs.current[focusIdx]?.focus();

    if (pasted.length === length && onComplete) {
      onComplete(pasted);
    }
  };

  return (
    <div className="flex justify-center gap-2 sm:gap-2.5 my-2">
      {Array.from({ length }).map((_, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[idx] || ""}
          onChange={(e) => handleDigitChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(idx, e)}
          onPaste={handlePaste}
          autoFocus={idx === 0}
          disabled={disabled}
          autoComplete={idx === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${idx + 1} of ${length}`}
          className={cn(
            "h-12 w-11 sm:h-13 sm:w-12 rounded-xl border text-center text-xl font-bold transition-all shadow-2xs",
            "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20",
            error
              ? "border-destructive text-destructive focus-visible:border-destructive focus-visible:ring-destructive/20"
              : value[idx]
              ? "border-primary bg-primary/5 text-primary dark:text-blue-400 font-bold"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white",
            disabled && "opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-950"
          )}
        />
      ))}
    </div>
  );
}
