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
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import { LanguageSelector } from "@/components/shared/language-selector";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-context";

export function AppHeader() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useTranslation();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHomePage = pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
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

  // Guest landing numbered navigation matching ai-product-portfolio
  const guestNavItems = [
    { href: "/#services", label: "Services", number: "01" },
    { href: "/#how-it-works", label: "How It Works", number: "02" },
    { href: "/#reviews", label: "Reviews", number: "03" },
    { href: "/#guarantees", label: "Guarantees", number: "04" },
    { href: "/#insights", label: "Insights", number: "05" },
    { href: "/voice-ai", label: "Voice AI", number: "06" },
  ];

  // Role-aware navigation when logged in
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

  const activeUserLinks = isAuthenticated && user
    ? user.role === "ADMIN" || user.role === "SUPPORT"
      ? adminLinks
      : user.role === "WORKER"
      ? workerLinks
      : customerLinks
    : [];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("/#") && isHomePage) {
      e.preventDefault();
      const targetId = href.replace("/#", "");
      const element = document.getElementById(targetId);
      if (element) {
        const offset = 80;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isScrolled || !isHomePage
          ? "bg-background/80 backdrop-blur-md border-b border-border shadow-xs"
          : "bg-transparent"
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
                background: "linear-gradient(135deg, #203eec 0%, #00d4ff 100%)",
              }}
            >
              <Hammer className="h-4 w-4" />
            </span>
            <div className="flex flex-col">
              <span className="font-sans font-bold text-xl tracking-tight text-foreground">
                KaamSetu
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-muted-foreground uppercase -mt-0.5">
                Blue-Collar Protocol
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden lg:flex items-center gap-7">
            {isAuthenticated && activeUserLinks.length > 0
              ? activeUserLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-foreground inline-flex items-center gap-1.5",
                      pathname === link.href || pathname.startsWith(`${link.href}/`)
                        ? "text-[#203eec] font-semibold"
                        : "text-muted-foreground"
                    )}
                  >
                    <link.icon className="w-4 h-4 opacity-70" />
                    <span>{link.label}</span>
                  </Link>
                ))
              : guestNavItems.map((item) => (
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

          {/* Right Action Elements */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <LanguageSelector className="inline-flex scale-90 sm:scale-100" />

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {resolvedTheme === "dark" ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* Auth / CTA Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href={
                    user.role === "ADMIN" || user.role === "SUPPORT"
                      ? "/admin"
                      : user.role === "WORKER"
                      ? "/worker/profile"
                      : "/customer/profile"
                  }
                  className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-xs font-semibold border border-border"
                >
                  <UserIcon className="w-3.5 h-3.5 text-[#203eec]" />
                  <span>{user.fullName || user.phoneNumber}</span>
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

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-border bg-background/95 backdrop-blur-xl px-6 py-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-3">
            {isAuthenticated && activeUserLinks.length > 0
              ? activeUserLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 text-base font-medium text-foreground py-1.5"
                  >
                    <link.icon className="w-4 h-4 text-[#203eec]" />
                    <span>{link.label}</span>
                  </Link>
                ))
              : guestNavItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleSmoothScroll(e, item.href)}
                    className="flex items-center justify-between text-base font-medium text-muted-foreground hover:text-foreground py-1.5 border-b border-border/40"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs font-mono text-muted-foreground">({item.number})</span>
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
