"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { BrandMark } from "@/components/shared/brand-mark";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-context";
import {
  dashboardNavigation,
  getNavigationForRole,
  labelFor,
  resolveActiveNav,
  type NavItem,
} from "@/config/dashboard-navigation";
import { useUnreadConversations } from "@/features/messaging/use-unread-conversations";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SidebarAccount } from "./sidebar-account";

export const SIDEBAR_WIDTH = 248;
export const SIDEBAR_COLLAPSED_WIDTH = 72;
export type SidebarRole = keyof typeof dashboardNavigation;

export interface DashboardSidebarProps {
  role: SidebarRole;
  /** User preference — only honoured at lg+; tablet is always collapsed. */
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

function NavRow({
  item,
  active,
  collapsed,
  badge,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badge?: number;
}) {
  const { t } = useTranslation();
  const Icon = item.icon;
  const label = labelFor(item, t);

  const link = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        // Compact 40px rows, 8px radius, 14px/500 — rectangular, no pills.
        "relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        collapsed && "justify-center px-0",
        active
          ? "bg-primary/10 font-semibold text-primary"
          : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-primary"
        />
      )}
      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span
          aria-label={`${badge} unread`}
          className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground"
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );

  if (!collapsed) return link;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{link}</TooltipTrigger>
      <TooltipContent side="right" className="font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function DashboardSidebar({ role, collapsed, onToggleCollapsed }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();
  const navigation = getNavigationForRole(role);
  const activeHref = resolveActiveNav(
    pathname,
    navigation.sections.flatMap((section) => section.items)
  );

  // Real unread count only — the badge hides itself at zero.
  const { data: unreadMessages = 0 } = useUnreadConversations();

  const roleLabel = role.charAt(0) + role.slice(1).toLowerCase();
  const homeHref =
    role === "WORKER" ? "/worker" : role === "ADMIN" ? "/admin" : "/customer";

  return (
    <TooltipProvider delayDuration={200}>
      {/* Fixed rail: hidden on phones (bottom nav covers primary destinations),
          collapsed 72px on tablet, user preference (248px/72px) on desktop. */}
      <aside
        data-state={collapsed ? "collapsed" : "expanded"}
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-border bg-background md:flex",
          "transition-[width] duration-200 ease-out motion-reduce:transition-none",
          collapsed ? "md:w-[72px] lg:w-[72px]" : "md:w-[72px] lg:w-[248px]"
        )}
      >
        {/* Sidebar header: compact 64px brand row */}
        <div className={cn("flex h-16 shrink-0 items-center border-b border-border px-4", collapsed && "justify-center px-0")}>
          <Link
            href={homeHref}
            className="flex items-center gap-2.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BrandMark size={30} className="h-[30px] w-[30px] rounded-md object-cover" />
            </span>
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight text-foreground">KaamSetu</span>
            )}
          </Link>
        </div>

        {/* Scrollable nav region */}
        <nav
          aria-label={`${roleLabel} navigation`}
          className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4"
        >
          {navigation.sections.map((section) => (
            <div key={section.labelKey} className="mb-5 last:mb-0">
              {!collapsed && (
                <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {t(section.labelKey, section.fallbackLabel)}
                </p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    active={activeHref === item.href}
                    collapsed={collapsed}
                    badge={item.href === "/messages" ? unreadMessages : undefined}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer: account summary + logout, then collapse control (lg+ only) */}
        <div className="shrink-0 border-t border-border">
          <SidebarAccount collapsed={collapsed} />
          <div className="flex h-10 items-center justify-end px-3 pb-1">
            <button
              type="button"
              onClick={onToggleCollapsed}
              // Tablet is always collapsed; the toggle is a desktop control.
              className="hidden h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-pressed={collapsed}
            >
              {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
