"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, MessageSquare, User, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-context";

export interface BottomNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeCount?: number;
}

export interface BottomNavigationProps {
  items?: BottomNavItem[];
  role?: "customer" | "worker";
}

export function BottomNavigation({
  items,
  role = "customer",
}: BottomNavigationProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const customerItems: BottomNavItem[] = [
    { label: t("nav.home", "Home"), href: "/customer", icon: Home },
    { label: t("nav.jobs", "My Jobs"), href: "/customer/jobs", icon: Briefcase },
    { label: t("nav.messages", "Messages"), href: "/customer/messages", icon: MessageSquare },
    { label: t("nav.profile", "Profile"), href: "/customer/profile", icon: User },
  ];

  const workerItems: BottomNavItem[] = [
    { label: t("nav.nearby", "Nearby"), href: "/worker", icon: Home },
    { label: t("nav.offers", "Offers"), href: "/worker/jobs", icon: Briefcase },
    { label: t("nav.messages", "Messages"), href: "/worker/messages", icon: MessageSquare },
    { label: t("nav.earnings", "Earnings"), href: "/worker/earnings", icon: User },
  ];

  const navItems = items || (role === "worker" ? workerItems : customerItems);

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      className="md:hidden fixed bottom-0 left-0 z-40 w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 pb-safe"
    >
      <div className="grid h-16 grid-cols-4 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/customer" && item.href !== "/worker" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] font-medium transition-all select-none min-h-touch",
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
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="absolute -right-1 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {item.badgeCount > 9 ? "9+" : item.badgeCount}
                  </span>
                ) : null}
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
