"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hammer,
  Wifi,
  WifiOff,
  Sun,
  Moon,
  LogIn,
  LogOut,
  User as UserIcon,
  LayoutDashboard,
  PlusCircle,
  Briefcase,
  MessageSquare,
  BellRing,
  IndianRupee,
  Users,
  ShieldCheck,
  ClipboardList,
  FileCheck,
  Mic,
  Menu,
  X,
} from "lucide-react";
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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Role-aware navigation — determined from user profile after login
  const customerLinks = [
    { href: "/customer", label: t("nav.dashboard", "Dashboard"), icon: LayoutDashboard },
    { href: "/customer/jobs/new", label: t("nav.bookService", "Book Service"), icon: PlusCircle },
    { href: "/customer/jobs", label: t("nav.myJobs", "My Jobs"), icon: Briefcase },
    { href: "/customer/messages", label: t("nav.messages", "Messages"), icon: MessageSquare },
    { href: "/customer/profile", label: t("nav.profile", "Profile"), icon: UserIcon },
  ];

  const workerLinks = [
    { href: "/worker", label: t("nav.overview", "Overview"), icon: LayoutDashboard },
    { href: "/worker/offers", label: t("nav.jobOffers", "Job Offers"), icon: BellRing },
    { href: "/worker/jobs", label: t("nav.activeWork", "Active Work"), icon: Briefcase },
    { href: "/worker/earnings", label: t("nav.earnings", "Earnings"), icon: IndianRupee },
    { href: "/worker/profile", label: t("nav.profile", "Profile"), icon: UserIcon },
  ];

  const adminLinks = [
    { href: "/admin", label: t("nav.dashboard", "Dashboard"), icon: LayoutDashboard },
    { href: "/admin/users", label: t("nav.users", "Users"), icon: Users },
    { href: "/admin/workers", label: t("nav.workers", "Workers"), icon: ShieldCheck },
    { href: "/admin/jobs", label: t("nav.jobs", "Jobs"), icon: ClipboardList },
    { href: "/admin/verifications", label: t("nav.verifications", "Verifications"), icon: FileCheck },
  ];

  const guestLinks = [
    { href: "/services", label: "Services", icon: Briefcase },
    { href: "/voice-ai", label: "Voice AI", icon: Mic },
  ];

  const navLinks = isAuthenticated && user
    ? user.role === "admin"
      ? adminLinks
      : user.role === "worker"
      ? workerLinks
      : customerLinks
    : guestLinks;

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

          {/* Desktop Navigation Links — role-aware */}
          {navLinks.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive =
                  link.href === `/${user?.role}` || link.href === "/admin"
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all min-h-[36px]",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden lg:inline">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
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
              <Link
                href={user.role === "admin" ? "/admin" : `/${user.role}/profile`}
                className="hidden sm:flex items-center gap-1.5 bg-secondary px-3 py-1 rounded-full text-xs font-medium border border-border/60 hover:bg-muted transition-colors"
              >
                <UserIcon className="h-3.5 w-3.5 text-primary" />
                <span className="font-mono font-bold text-foreground">{user.fullName || user.phoneNumber}</span>
                <span className="text-[9px] py-0.5 px-1.5 rounded-full bg-primary/10 text-primary font-bold uppercase">
                  {user.role}
                </span>
              </Link>
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
          {/* Mobile menu toggle button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden h-9 w-9 items-center justify-center rounded-full border border-border/80 bg-card text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </Container>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-background/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {isAuthenticated && user && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-secondary/60 border border-border/60 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                  {(user.fullName || user.phoneNumber).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground leading-tight">{user.fullName || user.phoneNumber}</p>
                  <span className="text-[9px] font-bold uppercase text-primary tracking-wider">{user.role}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" /> Logout
              </Button>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === `/${user?.role}` || link.href === "/admin"
                  ? pathname === link.href
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {!isAuthenticated && (
            <div className="pt-2 border-t flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full rounded-xl font-bold gap-2">
                  <LogIn className="h-4 w-4" /> Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
