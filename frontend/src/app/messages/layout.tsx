"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuth } from "@/features/auth/use-auth";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();

  // If viewing a specific conversation, hide the bottom navigation and remove the extra bottom padding
  // so the message input / composer stays cleanly docked at the bottom of the viewport on mobile.
  const isChatDetail = pathname ? /^\/messages\/[^/]+/.test(pathname) : false;

  const role =
    user?.role === "WORKER"
      ? "WORKER"
      : user?.role === "ADMIN" || user?.role === "SUPPORT"
        ? "ADMIN"
        : "CUSTOMER";
  const bottomNavRole = user?.role === "WORKER" ? "worker" : "customer";

  return (
    <AuthGuard fallbackUrl="/login">
      <DashboardShell
        role={role}
        fallbackTitle="Messages"
        contentClassName={isChatDetail ? "p-0 sm:px-4 sm:py-2 md:pb-2 max-w-4xl" : undefined}
      >
        {children}
      </DashboardShell>
      {!isChatDetail && <BottomNavigation role={bottomNavRole} />}
    </AuthGuard>
  );
}
