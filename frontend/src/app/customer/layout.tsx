"use client";

import { type ReactNode } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { BottomNavigation } from "@/components/layout/bottom-navigation";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["CUSTOMER", "WORKER"]} fallbackUrl="/login">
      {/* Shell renders sidebar (md+) and compact header; bottom navigation
          serves mobile primary destinations. One mount of children total. */}
      <DashboardShell role="CUSTOMER">
        {children}
      </DashboardShell>
      <BottomNavigation role="customer" />
    </AuthGuard>
  );
}
