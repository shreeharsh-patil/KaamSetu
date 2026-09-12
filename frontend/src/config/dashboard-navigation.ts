/**
 * Single source of truth for all authenticated navigation (sidebar, top bar
 * title, mobile bottom navigation, mobile drawer).
 *
 * Route matching strategy: `match` controls how the active state is resolved:
 *  - "exact": only the literal href (e.g. dashboard home, new-job flow)
 *  - "prefix": href or any nested route below it (e.g. job detail pages)
 * More specific hrefs always win: `resolveActiveNav` scores candidates by
 * path depth, so `/customer/jobs/new` (exact) beats `/customer/jobs` (prefix).
 */
import {
  LayoutDashboard,
  Plus,
  Briefcase,
  MessageSquare,
  User,
  BellRing,
  IndianRupee,
  Users,
  ShieldCheck,
  ClipboardList,
  FileCheck,
  Scale,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export type NavRole = "CUSTOMER" | "WORKER" | "ADMIN";

export interface NavItem {
  /** Route href (must be the real app route — do not add dead links). */
  href: string;
  /** Translation key; falls back to `fallback` label. */
  labelKey: string;
  fallback: string;
  icon: LucideIcon;
  match: "exact" | "prefix";
}

export interface NavSection {
  /** Section label translation key; empty string renders no label. */
  labelKey: string;
  fallbackLabel: string;
  items: NavItem[];
}

export interface RoleNavigation {
  sections: NavSection[];
  /** Mobile bottom navigation subset (max 5 destinations). */
  mobileHrefs: string[];
  /** Sidebar footer links (help etc.). Rendered only if configured. */
  footerItems: NavItem[];
}

const customerNavigation: RoleNavigation = {
  sections: [
    {
      labelKey: "nav.section.main",
      fallbackLabel: "Main",
      items: [
        { href: "/customer", labelKey: "nav.dashboard", fallback: "Dashboard", icon: LayoutDashboard, match: "exact" },
        { href: "/customer/jobs/new", labelKey: "nav.bookService", fallback: "Book Service", icon: Plus, match: "exact" },
        { href: "/customer/jobs", labelKey: "nav.myJobs", fallback: "My Jobs", icon: Briefcase, match: "prefix" },
        // Shared conversation list — /customer/messages redirects to /messages.
        { href: "/messages", labelKey: "nav.messages", fallback: "Messages", icon: MessageSquare, match: "prefix" },
      ],
    },
    {
      labelKey: "nav.section.account",
      fallbackLabel: "Account",
      items: [
        { href: "/customer/profile", labelKey: "nav.profile", fallback: "Profile", icon: User, match: "prefix" },
        // No "Saved Addresses" item: no such route/API exists yet.
      ],
    },
  ],
  mobileHrefs: ["/customer", "/customer/jobs", "/messages", "/customer/profile"],
  footerItems: [],
};

const workerNavigation: RoleNavigation = {
  sections: [
    {
      labelKey: "nav.section.work",
      fallbackLabel: "Work",
      items: [
        { href: "/worker", labelKey: "nav.overview", fallback: "Overview", icon: LayoutDashboard, match: "exact" },
        { href: "/worker/offers", labelKey: "nav.jobOffers", fallback: "Job Offers", icon: BellRing, match: "prefix" },
        { href: "/worker/jobs", labelKey: "nav.activeWork", fallback: "Active Jobs", icon: Briefcase, match: "prefix" },
        { href: "/messages", labelKey: "nav.messages", fallback: "Messages", icon: MessageSquare, match: "prefix" },
      ],
    },
    {
      labelKey: "nav.section.earningsAccount",
      fallbackLabel: "Earnings & Account",
      items: [
        { href: "/worker/earnings", labelKey: "nav.earnings", fallback: "Earnings", icon: IndianRupee, match: "prefix" },
        { href: "/worker/profile", labelKey: "nav.profile", fallback: "Profile", icon: User, match: "prefix" },
      ],
    },
  ],
  mobileHrefs: ["/worker", "/worker/offers", "/worker/jobs", "/messages", "/worker/earnings"],
  footerItems: [],
};

const adminNavigation: RoleNavigation = {
  sections: [
    {
      labelKey: "nav.section.operations",
      fallbackLabel: "Operations",
      items: [
        { href: "/admin", labelKey: "nav.overview", fallback: "Overview", icon: LayoutDashboard, match: "exact" },
        { href: "/admin/users", labelKey: "nav.users", fallback: "Users", icon: Users, match: "prefix" },
        { href: "/admin/workers", labelKey: "nav.workers", fallback: "Workers", icon: ShieldCheck, match: "prefix" },
        { href: "/admin/jobs", labelKey: "nav.jobs", fallback: "Jobs", icon: ClipboardList, match: "prefix" },
        { href: "/admin/verifications", labelKey: "nav.verifications", fallback: "Verifications", icon: FileCheck, match: "prefix" },
      ],
    },
    {
      labelKey: "nav.section.governance",
      fallbackLabel: "Governance",
      items: [
        { href: "/admin/disputes", labelKey: "nav.disputes", fallback: "Disputes", icon: Scale, match: "prefix" },
        { href: "/admin/audit", labelKey: "nav.auditLogs", fallback: "Audit Logs", icon: ScrollText, match: "prefix" },
        // No Reports / Categories admin routes exist yet — not added.
      ],
    },
  ],
  mobileHrefs: ["/admin", "/admin/users", "/admin/jobs", "/admin/disputes"],
  footerItems: [],
};

export const dashboardNavigation: Record<NavRole, RoleNavigation> = {
  CUSTOMER: customerNavigation,
  WORKER: workerNavigation,
  ADMIN: adminNavigation,
};

/** SUPPORT uses the admin navigation surface (backend enforces real perms). */
export function getNavigationForRole(role: string): RoleNavigation {
  return dashboardNavigation[(role as NavRole) in dashboardNavigation ? (role as NavRole) : "CUSTOMER"];
}

/**
 * Resolve which nav item is active for a pathname using longest-match scoring.
 * Exact matches beat prefix matches; deeper hrefs beat shallower ones.
 * Returns null when nothing matches.
 */
export function resolveActiveNav(
  pathname: string,
  items: ReadonlyArray<Pick<NavItem, "href" | "match">>
): string | null {
  let best: { href: string; score: number } | null = null;

  for (const item of items) {
    if (item.match === "exact") {
      if (pathname !== item.href) continue;
      // Exact match score: depth + tiebreaker bonus so it always beats prefix.
      const score = item.href.split("/").filter(Boolean).length * 10 + 5;
      if (!best || score > best.score) best = { href: item.href, score };
    } else {
      // Prefix: href itself or any nested route (bounded by '/').
      if (pathname !== item.href && !pathname.startsWith(`${item.href}/`)) continue;
      const score = item.href.split("/").filter(Boolean).length * 10;
      if (!best || score > best.score) best = { href: item.href, score };
    }
  }

  return best?.href ?? null;
}

/** Translate helper bound to the config — keeps consumers simple. */
export function labelFor(item: Pick<NavItem, "labelKey" | "fallback">, t: (key: string, fallback?: string) => string): string {
  return t(item.labelKey, item.fallback);
}
