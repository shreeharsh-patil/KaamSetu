"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  UserCheck,
  AlertOctagon,
  ShieldCheck,
  FileText,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { AuthGuard } from "@/features/auth/components/auth-guard";
import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const adminNav = [
    { href: "/admin", label: "Operations Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users Directory", icon: Users },
    { href: "/admin/workers", label: "Tradespeople", icon: Briefcase },
    { href: "/admin/verifications", label: "KYC Verifications", icon: UserCheck },
    { href: "/admin/disputes", label: "Dispute Resolutions", icon: AlertOctagon },
    { href: "/admin/audit", label: "Security & Audit Logs", icon: ShieldCheck },
  ];

  return (
    <AuthGuard requiredRole="admin" fallbackUrl="/login">
      <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem)]">
        {/* Admin Sidebar Navigation */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-muted/20 p-4 shrink-0">
          <div className="flex items-center gap-2 mb-6 px-3">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-bold text-sm tracking-tight text-foreground">
              Admin Governance
            </span>
          </div>

          <nav className="flex flex-col gap-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors min-h-touch",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Admin Main Workspace Content */}
        <main className="flex-1 flex flex-col py-6">
          <Container size="full" className="px-4 sm:px-6">
            {children}
          </Container>
        </main>
      </div>
    </AuthGuard>
  );
}
