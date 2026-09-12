"use client";

import { type ReactNode } from "react";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AuthGuard } from "@/features/auth/components/auth-guard";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requiredRole="worker" fallbackUrl="/login">
      <div className="flex-1 flex flex-col pb-20 md:pb-8 w-full">
        {/* Child Pages Content */}
        <div className="flex-1 flex flex-col w-full">{children}</div>

        {/* Mobile Bottom Navigation Dock */}
        <BottomNavigation role="worker" />
      </div>
    </AuthGuard>
  );
}
