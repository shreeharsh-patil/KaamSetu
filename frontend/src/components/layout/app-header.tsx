"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hammer, Wifi, WifiOff, Sun, Moon, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Container } from "./container";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/shared/language-selector";
import { useNetwork } from "@/providers/network-provider";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";

import { useTranslation } from "@/lib/i18n/i18n-context";

export function AppHeader() {
  const pathname = usePathname();
  const { isOnline } = useNetwork();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

  const navLinks = [
    { href: "/customer", label: t("header.customerPortal", "Customer Portal"), badge: t("header.hire", "Hire") },
    { href: "/worker", label: t("header.workerPortal", "Worker Portal"), badge: t("header.earn", "Earn") },
    { href: "/admin", label: t("header.adminConsole", "Admin Console"), badge: t("header.ops", "Ops") },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container className="flex h-16 items-center justify-between">
        {/* Brand Logo & Location */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg text-primary tracking-tight transition-opacity hover:opacity-90 min-h-touch"
            aria-label="KaamSetu Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Hammer className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight font-extrabold text-foreground text-base sm:text-lg">KaamSetu</span>
              <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase">
                {t("header.sub", "Hyperlocal Bazaar")}
              </span>
            </div>
          </Link>

          {/* Location Chip */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/80 border border-border/60 text-xs font-medium text-foreground">
            <span className="text-primary font-bold">📍</span>
            <span>{t("header.location", "Mumbai Suburban")}</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px]",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <span>{link.label}</span>
                  <span
                    className={cn(
                      "text-[9px] py-0 px-1.5 rounded-full font-bold uppercase",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {link.badge}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Network indicator, Language, Theme, Auth */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Language selector - always accessible */}
          <LanguageSelector className="inline-flex" />

          {/* Network connectivity badge */}
          <div
            className={cn(
              "hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold border",
              isOnline
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            )}
            title={isOnline ? t("status.online", "Network: Online") : t("status.offline", "Network: Offline")}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">{t("status.online", "Online")}</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3 text-red-600 dark:text-red-400" />
                <span>{t("status.offline", "Offline")}</span>
              </>
            )}
          </div>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4 w-4 text-amber-400" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700" />
            )}
          </button>

          {/* Auth State Button */}
          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 bg-secondary px-3 py-1 rounded-full text-xs font-medium border border-border/60">
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono font-bold text-foreground">{user.phoneNumber}</span>
                <span className="text-[9px] py-0.5 px-1.5 rounded-full bg-primary/10 text-primary font-bold uppercase">
                  {user.role}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                leftIcon={<LogOut className="h-3.5 w-3.5" />}
                title={t("nav.logout", "Logout")}
                className="rounded-full"
              >
                <span className="hidden sm:inline">{t("nav.logout", "Logout")}</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" className="rounded-full px-3.5 sm:px-4" leftIcon={<LogIn className="h-3.5 w-3.5" />}>
                <span>{t("nav.login", "Sign In")}</span>
              </Button>
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}
