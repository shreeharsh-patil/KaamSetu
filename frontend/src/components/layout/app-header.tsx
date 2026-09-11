"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Hammer, Wifi, WifiOff, Sun, Moon, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { Container } from "./container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/shared/language-selector";
import { useNetwork } from "@/providers/network-provider";
import { useTheme } from "@/providers/theme-provider";
import { useAuth } from "@/features/auth/use-auth";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const pathname = usePathname();
  const { isOnline } = useNetwork();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  const navLinks = [
    { href: "/customer", label: "Customer Portal", badge: "Hire" },
    { href: "/worker", label: "Worker Portal", badge: "Earn" },
    { href: "/admin", label: "Admin Console", badge: "Ops" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <Container className="flex h-16 items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 font-bold text-lg text-primary tracking-tight transition-opacity hover:opacity-90 min-h-touch"
            aria-label="KaamSetu Home"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Hammer className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">KaamSetu</span>
              <span className="text-[10px] font-medium tracking-normal text-muted-foreground uppercase">
                Hyperlocal Trades
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-touch",
                    isActive
                      ? "bg-secondary text-foreground font-semibold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{link.label}</span>
                  <Badge
                    variant={isActive ? "default" : "outline"}
                    className="text-[10px] py-0 px-1.5 font-normal"
                  >
                    {link.badge}
                  </Badge>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: Network indicator, Language, Theme, Auth */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Language selector */}
          <LanguageSelector className="hidden sm:inline-flex" />

          {/* Network connectivity badge */}
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border",
              isOnline
                ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
            )}
            title={isOnline ? "Network: Online" : "Network: Offline"}
          >
            {isOnline ? (
              <>
                <Wifi className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden lg:inline">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                <span>Offline</span>
              </>
            )}
          </div>

          {/* Theme switcher */}
          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <div className="hidden sm:flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-md text-xs">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono font-medium">{user.phoneNumber}</span>
                <Badge variant="secondary" className="text-[10px] py-0 px-1 uppercase">
                  {user.role}
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => logout()}
                leftIcon={<LogOut className="h-3.5 w-3.5" />}
                title="Logout"
              >
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm" leftIcon={<LogIn className="h-3.5 w-3.5" />}>
                <span>Sign In</span>
              </Button>
            </Link>
          )}
        </div>
      </Container>
    </header>
  );
}
