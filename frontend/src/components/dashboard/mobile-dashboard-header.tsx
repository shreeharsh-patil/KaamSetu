"use client";

import Link from "next/link";
import { Bell, Hammer } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/use-auth";
import { useNotifications } from "@/features/notifications/use-notifications";

/**
 * Compact mobile header for authenticated dashboard pages.
 * The desktop sidebar is hidden on phones; this header + the existing bottom
 * navigation cover primary destinations (per the mobile strategy).
 */
export function MobileDashboardHeader() {
  const { user } = useAuth();
  const { data: unreadNotifications = 0 } = useNotifications();
  const displayName = user?.fullName?.trim() || "Account";

  const profileHref =
    user?.role === "WORKER"
      ? "/worker/profile"
      : user?.role === "ADMIN" || user?.role === "SUPPORT"
        ? "/admin"
        : "/customer/profile";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur md:hidden">
      <Link href="/" className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Hammer className="h-4 w-4" aria-hidden />
        </span>
        <span className="text-base font-bold tracking-tight text-foreground">KaamSetu</span>
      </Link>

      <div className="flex items-center gap-1">
        <Link
          href="/notifications"
          aria-label={unreadNotifications > 0 ? `Notifications (${unreadNotifications} unread)` : "Notifications"}
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" aria-hidden />
          {unreadNotifications > 0 && (
            <span
              aria-hidden
              className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground"
            >
              {unreadNotifications > 9 ? "9+" : unreadNotifications}
            </span>
          )}
        </Link>
        <Link
          href={profileHref}
          aria-label="Account"
          className="inline-flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Avatar className="h-8 w-8 border">
            <AvatarImage src={user?.profilePhotoUrl ?? undefined} alt="" />
            <AvatarFallback className="text-[10px] font-semibold">
              {displayName.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>
      </div>
    </header>
  );
}
