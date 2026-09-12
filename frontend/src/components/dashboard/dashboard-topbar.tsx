"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, LogOut, Menu, Moon, Sun, User as UserIcon } from "lucide-react";
import { LanguageSelector } from "@/components/shared/language-selector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/features/auth/use-auth";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "@/features/notifications/use-notifications";
import { BrandMark } from "@/components/shared/brand-mark";

export interface DashboardTopbarProps {
  title?: string;
  /** Optional breadcrumb trail rendered only when provided. */
  breadcrumbs?: ReadonlyArray<{ label: string; href?: string }>;
  onOpenMobileNav?: () => void;
}

/**
 * Compact top bar inside the scrolling main column.
 * Mobile: brand + notifications + account (primary nav = bottom navigation).
 * Desktop: page title / breadcrumb + language, theme, notifications, account.
 */
export function DashboardTopbar({ title = "Dashboard", breadcrumbs, onOpenMobileNav }: DashboardTopbarProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const { data: unreadNotifications = 0 } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const profileHref =
    user?.role === "WORKER"
      ? "/worker/profile"
      : user?.role === "ADMIN" || user?.role === "SUPPORT"
        ? "/admin"
        : "/customer/profile";

  const displayName = user?.fullName?.trim() || "Account";

  return (
    <TooltipProvider delayDuration={200}>
      <header className="sticky top-0 z-30 flex h-[60px] shrink-0 items-center gap-1.5 xs:gap-3 border-b border-border bg-background/95 px-3 xs:px-4 backdrop-blur sm:px-6">
        {/* Mobile drawer toggle */}
        {onOpenMobileNav && (
          <button
            type="button"
            onClick={onOpenMobileNav}
            aria-label="Open navigation menu"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </button>
        )}

        {/* Mobile brand (sidebar is hidden on phones) */}
        <Link
          href="/"
          className="flex shrink-0 items-center gap-1.5 xs:gap-2 md:hidden"
          aria-label="KaamSetu home"
        >
          <span className="flex h-7 w-7 xs:h-8 xs:w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shrink-0">
            <BrandMark size={32} className="h-full w-full rounded-md object-cover" />
          </span>
          <span className="text-sm xs:text-base font-bold tracking-tight text-foreground">KaamSetu</span>
        </Link>

        {/* Page title / breadcrumb — hidden on mobile (bottom nav is primary there) */}
        <div className="min-w-0 flex-1 md:block">
          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
              {breadcrumbs.map((crumb, i) => (
                <span key={`${crumb.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                  {i > 0 && <span className="text-muted-foreground/60">/</span>}
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="truncate text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="truncate font-semibold text-foreground">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          ) : (
            <h1 className="hidden truncate text-lg font-semibold tracking-tight text-foreground md:block">
              {title}
            </h1>
          )}
        </div>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-0.5 xs:gap-1 shrink-0">
          <LanguageSelector className="scale-90 xs:scale-95" />

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                aria-label={resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {resolvedTheme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>Theme</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/notifications"
                aria-label={unreadNotifications > 0 ? `Notifications (${unreadNotifications} unread)` : "Notifications"}
                className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Bell className="h-[18px] w-[18px]" aria-hidden />
                {unreadNotifications > 0 && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1",
                      "text-[9px] font-bold text-destructive-foreground"
                    )}
                  >
                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                  </span>
                )}
              </Link>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>

          {/* Account popover */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-md p-1 pr-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar className="h-7 w-7 border">
                <AvatarImage src={user?.profilePhotoUrl ?? undefined} alt="" />
                <AvatarFallback className="text-[10px] font-semibold">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </button>

            {menuOpen && user && (
              <div
                role="menu"
                aria-label="Account"
                className="absolute right-0 top-full z-50 mt-1.5 w-56 overflow-hidden rounded-lg border border-border bg-background shadow-md"
              >
                <div className="border-b border-border px-3 py-2.5">
                  <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </div>
                <Link
                  href={profileHref}
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-foreground hover:bg-muted outline-none focus-visible:bg-muted"
                >
                  <UserIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
                  Profile
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={async () => {
                    setMenuOpen(false);
                    await logout();
                    router.push("/login");
                  }}
                  className="flex w-full items-center gap-2.5 border-t border-border px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5 outline-none focus-visible:bg-destructive/5"
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </TooltipProvider>
  );
}
