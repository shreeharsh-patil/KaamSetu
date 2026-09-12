"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthCardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
  className?: string;
}

export function AuthCard({
  children,
  title,
  subtitle,
  backHref,
  onBack,
  className,
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[440px] mx-auto bg-white dark:bg-slate-900/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6 transition-all",
        className
      )}
    >
      {/* Top Bar: Back button or mobile brand header */}
      <div className="flex items-center justify-between min-h-[28px]">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-1 pr-2 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </Link>
        ) : onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors py-1 pr-2 rounded-lg"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
        ) : (
          <span />
        )}

        {/* Mobile-only logo */}
        <div className="lg:hidden flex items-center gap-1.5">
          <div className="h-6 w-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            K
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Kaam<span className="text-blue-600">Setu</span>
          </span>
        </div>
      </div>

      {/* Header section */}
      {(title || subtitle) && (
        <div className="space-y-1.5 text-left">
          {title && (
            <h2 className="text-2xl sm:text-[26px] font-bold tracking-tight text-slate-900 dark:text-white">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-normal">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Form Content */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
