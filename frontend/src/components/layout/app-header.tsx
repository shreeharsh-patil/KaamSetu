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

const DASHBOARD_ROOTS = ["/customer", "/worker", "/admin"];

function useIsAuthenticatedDashboard(): boolean {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  return (
    isAuthenticated &&
    DASHBOARD_ROOTS.some(
      (root) => pathname === root || pathname.startsWith(`${root}/`)
    )
  );
}

// Guest landing navigation
const guestNavItems = [
  { href: "/#services", label: "Services", number: "01" },
  { href: "/#how-it-works", label: "How It Works", number: "02" },
  { href: "/#reviews", label: "Reviews", number: "03" },
  { href: "/#guarantees", label: "Guarantees", number: "04" },
  { href: "/#insights", label: "Insights", number: "05" },
  { href: "/voice-ai", label: "Voice AI", number: "06" },
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
    const handleScroll = () => setIsScrolled(window.scrollY > 30);
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
        const offset = 80;
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
          : "bg-background/80 backdrop-blur-sm border-b border-border/40"
      )}
    >
      <div className="max-w-[1280px] mx-auto px-6 md:px-12">
        <nav className="flex items-center justify-between h-16 md:h-20">
          {/* Brand Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-semibold text-lg tracking-tight group"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-xs transition-transform group-hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #162044 0%, #203eec 100%)",
              }}
            >
              <Hammer className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-xl tracking-tight text-foreground">
                KaamSetu
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase -mt-0.5">
                Hyperlocal Marketplace
              </span>
            </div>
          </Link>

          {/* Desktop Guest Nav */}
          <div className="hidden lg:flex items-center gap-7">
            {guestNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                <span>{item.label}</span>
                <span className="text-xs ml-1 opacity-40 group-hover:opacity-80 transition-opacity font-mono">
                  ({item.number})
                </span>
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <LanguageSelector className="inline-flex scale-90 sm:scale-100" />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary"
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
              <div className="flex items-center gap-2">
                <Link
                  href={
                    user.role === "ADMIN" || user.role === "SUPPORT"
                      ? "/admin"
                      : user.role === "WORKER"
                      ? "/worker"
                      : "/customer"
                  }
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold border border-border"
                >
                  <UserIcon className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {user.fullName
                      ? user.fullName.split(" ")[0]
                      : t("nav.dashboard", "Dashboard")}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="hidden sm:inline-flex p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/customer/jobs/new"
                  className="inline-flex items-center justify-center px-5 py-2.5 text-xs sm:text-sm font-semibold rounded-full text-white transition-all hover:shadow-xl relative overflow-hidden group shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                    boxShadow: "0 4px 18px rgba(32, 62, 236, 0.35)",
                  }}
                >
                  <span className="relative z-10 flex items-center gap-1.5">
                    Book Service
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-md bg-gradient-to-r from-[#203eec] to-[#00d4ff]" />
                </Link>
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background/95 backdrop-blur-xl px-6 py-6 space-y-4 animate-menu-drop">
          <div className="flex flex-col space-y-3">
            {guestNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={(e) => handleSmoothScroll(e, item.href)}
                className="flex items-center justify-between text-base font-medium text-muted-foreground hover:text-foreground py-1.5 border-b border-border/40"
              >
                <span>{item.label}</span>
                <span className="text-xs font-mono text-muted-foreground">
                  ({item.number})
                </span>
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
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full border border-border text-sm font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-2.5 rounded-full border border-border text-sm font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  href="/customer/jobs/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center py-3 rounded-full text-white text-sm font-semibold"
                  style={{
                    background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
                  }}
                >
                  Book Service Now
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
