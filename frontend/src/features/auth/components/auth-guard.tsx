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
  allowedRoles?: UserRole[];
  fallbackUrl?: string;
}

export function AuthGuard({
  children,
  requiredRole,
  allowedRoles,
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

  const permittedRoles = allowedRoles ?? (requiredRole ? [requiredRole] : undefined);
  if (permittedRoles && (!user || !permittedRoles.includes(user.role))) {
    return (
      <div className="py-12">
        <ForbiddenState
          title="Role Access Restricted"
          description={`Your account is registered as ${user?.role || "user"}. This section requires ${permittedRoles.join(" or ")} access.`}
          requiredRole={permittedRoles.join(" or ")}
        />
      </div>
    );
  }

  return <>{children}</>;
}
