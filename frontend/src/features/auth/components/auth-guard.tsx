"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../use-auth";
import { LoadingSkeleton } from "@/components/feedback/loading-skeleton";
import { ForbiddenState } from "@/components/feedback/forbidden-state";
import type { UserRole } from "../types";

export interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallbackUrl?: string;
}

export function AuthGuard({
  children,
  requiredRole,
  fallbackUrl = "/login",
}: AuthGuardProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const redirectUrl = `${fallbackUrl}?redirect=${encodeURIComponent(pathname)}`;
      router.push(redirectUrl);
    }
  }, [isLoading, isAuthenticated, router, pathname, fallbackUrl]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="py-12">
        <ForbiddenState
          title="Role Access Restricted"
          description={`Your account is registered as a ${user?.role || "user"}. This section requires ${requiredRole} credentials.`}
          requiredRole={requiredRole}
        />
      </div>
    );
  }

  return <>{children}</>;
}
