"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-context";
import {
  getNavigationForRole,
  resolveActiveNav,
  labelFor,
  type NavRole,
} from "@/config/dashboard-navigation";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardTopbar } from "./dashboard-topbar";

const COLLAPSE_KEY = "kaamsetu_sidebar_collapsed";

export interface DashboardShellProps {
  role?: NavRole;
  /** Fallback top-bar title when no nav item matches the route. */
  fallbackTitle?: string;
  children: ReactNode;
}

function readCollapsedPref(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Authenticated dashboard shell — one mount of children across all breakpoints.
 *
 * Desktop (>=1024px): fixed sidebar (248px / 72px collapsed) + compact top bar.
 * Tablet (768–1023px): collapsed 72px rail, same top bar.
 * Mobile (<768px): no sidebar — compact brand top bar + the existing bottom
 * navigation mounted by the role layouts (Option A mobile strategy).
 *
 * Top-bar title is derived from the active nav item (longest-match), so
 * `/customer/jobs/new` shows "Book Service" while `/customer/jobs/[id]`
 * shows "My Jobs" — no per-page title wiring needed. Sidebar offsets are
 * centralized here; pages must never set their own margin-left.
 */
export function DashboardShell({ role: propRole, fallbackTitle, children }: DashboardShellProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const role: NavRole =
    propRole ??
    (pathname?.startsWith("/admin")
      ? "ADMIN"
      : pathname?.startsWith("/worker")
        ? "WORKER"
        : "CUSTOMER");

  // Default expanded; stored preference applied after mount (hydration-safe).
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(readCollapsedPref());
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // storage unavailable — preference simply not persisted
      }
      return next;
    });
  }, []);

  const nav = getNavigationForRole(role);
  const allItems = nav.sections.flatMap((s) => s.items);
  const activeHref = resolveActiveNav(pathname, allItems);
  const activeItem = allItems.find((i) => i.href === activeHref);
  const title = activeItem
    ? labelFor(activeItem, t)
    : (fallbackTitle ?? role.charAt(0) + role.slice(1).toLowerCase());

  return (
    <div className="min-h-svh bg-muted/20">
      <DashboardSidebar
        role={role}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
      />

      {/* Main column: offset equals sidebar width — centralized, pages never set margins. */}
      <div
        className={cn(
          "flex min-h-svh flex-col transition-[padding] duration-200 ease-out motion-reduce:transition-none",
          // Tablet: collapsed 72px rail. Desktop: 248px expanded / 72px collapsed.
          "md:pl-[72px]",
          collapsed ? "lg:pl-[72px]" : "lg:pl-[248px]"
        )}
      >
        <DashboardTopbar title={title} />

        <main id="main-content" className="flex-1">
          {/* pb-24 md:pb-6: clears the fixed mobile bottom navigation. */}
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 pb-24 sm:px-6 lg:px-8 md:pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
