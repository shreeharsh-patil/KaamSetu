"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/use-auth";
import { AppFooter } from "./app-footer";

const DASHBOARD_ROOTS = ["/customer", "/worker", "/admin"];

/**
 * Renders AppFooter only on public/guest pages.
 * Hides it on authenticated dashboard routes (sidebar layout owns the page chrome).
 */
export function ConditionalFooter() {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const isDashboard =
    isAuthenticated &&
    DASHBOARD_ROOTS.some(
      (root) => pathname === root || pathname.startsWith(`${root}/`)
    );

  if (isDashboard) return null;

  return <AppFooter />;
}
