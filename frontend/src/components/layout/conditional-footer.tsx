"use client";

import { usePathname } from "next/navigation";
import { AppFooter } from "./app-footer";

const DASHBOARD_ROOTS = ["/customer", "/worker", "/admin", "/messages"];

const AUTH_ROOTS = ["/login", "/signup", "/verify-otp", "/complete-profile"];

/**
 * Renders AppFooter only on public marketing pages.
 * Hides it on authenticated dashboard routes and dedicated auth routes.
 */
export function ConditionalFooter() {
  const pathname = usePathname();

  const isHidden = [...DASHBOARD_ROOTS, ...AUTH_ROOTS].some(
    (root) => pathname === root || pathname.startsWith(`${root}/`)
  );

  if (isHidden) return null;

  return <AppFooter />;
}
