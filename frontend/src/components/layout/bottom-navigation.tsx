"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Briefcase, MessageSquare, User, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

const defaultCustomerItems: BottomNavItem[] = [
  { label: "Home", href: "/customer", icon: Home },
  { label: "My Jobs", href: "/customer/jobs", icon: Briefcase },
  { label: "Messages", href: "/customer/messages", icon: MessageSquare },
  { label: "Profile", href: "/customer/profile", icon: User },
];

const defaultWorkerItems: BottomNavItem[] = [
  { label: "Nearby", href: "/worker", icon: Home },
  { label: "Offers", href: "/worker/jobs", icon: Briefcase },
  { label: "Messages", href: "/worker/messages", icon: MessageSquare },
  { label: "Earnings", href: "/worker/earnings", icon: User },
];

export function BottomNavigation({
  items,
  role = "customer",
}: BottomNavigationProps) {
  const pathname = usePathname();
  const navItems = items || (role === "worker" ? defaultWorkerItems : defaultCustomerItems);

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
                "relative flex flex-col items-center justify-center gap-1 py-1 text-[11px] font-medium transition-colors select-none min-h-touch",
                isActive
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                    {item.badgeCount > 9 ? "9+" : item.badgeCount}
                  </span>
                ) : null}
              </div>
              <span>{item.label}</span>
              {isActive && (
                <span className="absolute bottom-1 h-0.5 w-6 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
