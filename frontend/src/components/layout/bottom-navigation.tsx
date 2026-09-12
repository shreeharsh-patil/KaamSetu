"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, MessageSquare, User, IndianRupee, BellRing, LayoutDashboard, Users, Scale, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { dashboardNavigation, resolveActiveNav, type NavRole } from "@/config/dashboard-navigation";

export interface BottomNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeCount?: number;
}

export interface BottomNavigationProps {
  role?: "customer" | "worker" | "admin";
}

/** href → icon for config-driven bottom nav items. */
const ICON_BY_HREF: Record<string, LucideIcon> = {
  "/customer": LayoutDashboard,
  "/customer/jobs": Briefcase,
  "/messages": MessageSquare,
  "/customer/profile": User,
  "/worker": LayoutDashboard,
  "/worker/offers": BellRing,
  "/worker/jobs": Briefcase,
  "/worker/earnings": IndianRupee,
  "/admin": LayoutDashboard,
  "/admin/users": Users,
  "/admin/jobs": Briefcase,
  "/admin/disputes": Scale,
};

const FALLBACK_ICONS: Record<string, LucideIcon> = {
  customer: Home,
  worker: Home,
  admin: LayoutDashboard,
};

/**
 * Mobile bottom navigation — driven by the same dashboard-navigation config
 * as the sidebar (`mobileHrefs`), so destinations never drift between the two.
 */
export function BottomNavigation({ role = "customer" }: BottomNavigationProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const navRole: NavRole =
    role === "worker" ? "WORKER" : role === "admin" ? "ADMIN" : "CUSTOMER";
  const config = dashboardNavigation[navRole];

  const navItems: BottomNavItem[] = config.mobileHrefs
    .map((href) => {
      const item = config.sections.flatMap((s) => s.items).find((i) => i.href === href);
      if (!item) return null;
      return {
        href,
        label: t(item.labelKey, item.fallback),
        icon: ICON_BY_HREF[href] ?? FALLBACK_ICONS[role] ?? Home,
      } satisfies BottomNavItem;
    })
    .filter((v): v is BottomNavItem => v !== null);

  const activeHref = resolveActiveNav(pathname, config.mobileHrefs.map((href) => {
    const item = config.sections.flatMap((s) => s.items).find((i) => i.href === href);
    return { href, match: item?.match ?? ("prefix" as const) };
  }));

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 z-40 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-[env(safe-area-inset-bottom)]"
    >
      <div
        className="grid items-center"
        style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeHref === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-1.5 pt-2 text-[11px] font-medium transition-all select-none min-h-touch",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "relative flex items-center justify-center px-3.5 py-1 rounded-full transition-all",
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform", isActive && "stroke-[2.5px] scale-105")} />
              </div>
              <span className={cn("tracking-tight text-[10px]", isActive ? "font-bold text-primary" : "font-medium")}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
