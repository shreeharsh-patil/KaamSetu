"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Hammer,
  Sun,
  Moon,
  LogOut,
  User as UserIcon,
  ArrowUpRight,
  Menu,
  X,
} from "lucide-react";
import { LanguageSelector } from "@/components/shared/language-selector";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-context";

/**
 * AppHeader — serves public/guest pages only.
 *
 * On authenticated dashboard routes (/customer, /worker, /admin) the
 * DashboardShell renders its own sidebar + compact topbar, so AppHeader
 * hides itself to avoid duplicate navigation.
 */

const DASHBOARD_ROOTS = ["/customer", "/worker", "/admin", "/messages"];

function useIsAuthenticatedDashboard(): boolean {
  const pathname = usePathname();
  return DASHBOARD_ROOTS.some(
    (root) => pathname === root || pathname.startsWith(`${root}/`)
  );
}

// Primary desktop guest navigation (streamlined to fit without crowding)
const desktopNavItems = [
  { href: "/#services", label: "Services" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/voice-ai", label: "Voice AI" },
];

// Full guest navigation for mobile menu
const mobileNavItems = [
  { href: "/#services", label: "Services" },
  { href: "/#how-it-works", label: "How It Works" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#guarantees", label: "Guarantees" },
  { href: "/#insights", label: "Insights" },
  { href: "/voice-ai", label: "Voice AI" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();
  const isDashboard = useIsAuthenticatedDashboard();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("/#") && isHomePage) {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      const element = document.getElementById(targetId);
      if (element) {
        const offset = 72;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const offsetPosition = elementRect - bodyRect - offset;
        window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      }
      setMobileMenuOpen(false);
    }
  };

  // Hide on authenticated dashboard routes — sidebar handles navigation there
  if (isDashboard) {
    return null;
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-200",
        isScrolled || !isHomePage
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-xs"
          : "bg-background/85 backdrop-blur-sm border-b border-border/40"
      )}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 lg:h-[68px] gap-4">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-lg tracking-tight group shrink-0"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs transition-transform group-hover:scale-105">
              <Hammer className="h-4 w-4" />
            </span>
            <div className="flex flex-col shrink-0">
              <span className="font-sans font-bold text-lg sm:text-xl tracking-tight text-foreground leading-tight whitespace-nowrap">
                KaamSetu
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase whitespace-nowrap leading-none mt-0.5">
                Hyperlocal Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Guest Nav */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-7">
            {desktopNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap py-1"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <LanguageSelector className="inline-flex h-9 scale-95 sm:scale-100" />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-muted border border-border/60 shrink-0"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Auth CTA or logout */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={
                    user.role === "ADMIN" || user.role === "SUPPORT"
                      ? "/admin"
                      : user.role === "WORKER"
                      ? "/worker"
                      : "/customer"
                  }
                  className="hidden sm:inline-flex items-center gap-2 px-3 h-9 rounded-lg bg-secondary text-xs font-semibold border border-border whitespace-nowrap"
                >
                  <UserIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="whitespace-nowrap">
                    {user.fullName
                      ? user.fullName.split(" ")[0]
                      : t("nav.dashboard", "Dashboard")}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors hover:bg-muted border border-border/60 shrink-0"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex items-center h-9 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2.5 sm:px-3 whitespace-nowrap"
                >
                  Sign In
                </Link>
                <Link
                  href="/customer/jobs/new"
                  className="inline-flex items-center justify-center h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap shadow-xs"
                >
                  <span>Book Service</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1 shrink-0" />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background/95 backdrop-blur-xl px-6 py-6 space-y-4 animate-menu-drop">
          <div className="flex flex-col space-y-2">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="flex items-center justify-between text-base font-medium text-muted-foreground hover:text-foreground py-2 border-b border-border/40 whitespace-nowrap"
              >
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="pt-4 border-t border-border flex flex-col gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 rounded-lg border border-border text-sm font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  href="/customer/jobs/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-xs"
                >
                  Book Service
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
