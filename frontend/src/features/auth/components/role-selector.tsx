"use client";

import { cn } from "@/lib/utils";

export type AuthRole = "CUSTOMER" | "WORKER";

interface RoleSelectorProps {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
  disabled?: boolean;
}

export function RoleSelector({ value, onChange, disabled }: RoleSelectorProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select account type"
      className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
    >
      <button
        type="button"
        role="radio"
        aria-checked={value === "CUSTOMER"}
        disabled={disabled}
        onClick={() => onChange("CUSTOMER")}
        className={cn(
          "flex flex-col items-center justify-center py-2.5 px-3 rounded-xl text-center transition-all min-h-[52px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          value === "CUSTOMER"
            ? "bg-white dark:bg-slate-800 text-[#102a4c] dark:text-white shadow-sm border border-[#1d5be8]/30 ring-1 ring-[#1d5be8]/10"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        )}
      >
        <span className="text-xs sm:text-sm font-semibold leading-tight">Hire services</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
          Book trusted workers
        </span>
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={value === "WORKER"}
        disabled={disabled}
        onClick={() => onChange("WORKER")}
        className={cn(
          "flex flex-col items-center justify-center py-2.5 px-3 rounded-xl text-center transition-all min-h-[52px]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
          value === "WORKER"
            ? "bg-white dark:bg-slate-800 text-[#102a4c] dark:text-white shadow-sm border border-[#1d5be8]/30 ring-1 ring-[#1d5be8]/10"
            : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        )}
      >
        <span className="text-xs sm:text-sm font-semibold leading-tight">Find work</span>
        <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
          Get jobs near you
        </span>
      </button>
    </div>
  );
}
