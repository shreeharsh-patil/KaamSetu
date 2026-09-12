"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/worker/onboarding";

  return (
    <AuthGuard allowedRoles={isOnboarding ? ["CUSTOMER", "WORKER"] : ["WORKER"]} fallbackUrl="/login">
      <DashboardShell role="WORKER">
        {children}
      </DashboardShell>
      <BottomNavigation role="worker" />
    </AuthGuard>
  );
}
