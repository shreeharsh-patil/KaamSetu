"use client";

import { type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AuthGuard } from "@/features/auth/components/auth-guard";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/worker/onboarding";
  return (
    <AuthGuard allowedRoles={isOnboarding ? ["CUSTOMER", "WORKER"] : ["WORKER"]} fallbackUrl="/login">
      <div className="flex-1 flex flex-col pb-20 md:pb-8">
        {/* Child Pages Content */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Mobile Bottom Navigation Dock */}
        <BottomNavigation role="worker" />
      </div>
    </AuthGuard>
  );
}
