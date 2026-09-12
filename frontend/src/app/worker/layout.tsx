"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BellRing, Briefcase, IndianRupee, User } from "lucide-react";
import { Container } from "@/components/layout/container";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { cn } from "@/lib/utils";

export default function WorkerLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const workerLinks = [
    { href: "/worker", label: "Overview", icon: LayoutDashboard },
    { href: "/worker/offers", label: "Job Offers", icon: BellRing },
    { href: "/worker/jobs", label: "Active Work", icon: Briefcase },
    { href: "/worker/earnings", label: "Earnings & Ledger", icon: IndianRupee },
    { href: "/worker/profile", label: "Trade Profile", icon: User },
  ];

  return (
    <AuthGuard requiredRole="worker" fallbackUrl="/login">
      <div className="flex-1 flex flex-col pb-20 md:pb-8">
        {/* Desktop sub-navigation */}
        <div className="hidden md:block border-b bg-muted/20">
          <Container className="flex items-center gap-2 py-2">
            {workerLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-touch",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </Container>
        </div>

        {/* Child Pages Content */}
        <div className="flex-1 flex flex-col">{children}</div>

        {/* Mobile Bottom Navigation Dock */}
        <BottomNavigation role="worker" />
      </div>
    </AuthGuard>
  );
}
