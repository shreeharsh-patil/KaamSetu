"use client";

import { type ReactNode } from "react";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard allowedRoles={["ADMIN", "SUPPORT"]} fallbackUrl="/login">
      <DashboardShell role="ADMIN">
        {children}
      </DashboardShell>
    </AuthGuard>
  );
}
