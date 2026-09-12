"use client";

import { type ReactNode } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useAuth } from "@/features/auth/use-auth";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const role =
    user?.role === "WORKER"
      ? "WORKER"
      : user?.role === "ADMIN" || user?.role === "SUPPORT"
        ? "ADMIN"
        : "CUSTOMER";
  const bottomNavRole = user?.role === "WORKER" ? "worker" : "customer";

  return (
    <AuthGuard fallbackUrl="/login">
      <DashboardShell role={role} fallbackTitle="Messages">
        {children}
      </DashboardShell>
      <BottomNavigation role={bottomNavRole} />
    </AuthGuard>
  );
}
