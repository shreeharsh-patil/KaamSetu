"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Tv,
  Building2,
  PlusCircle,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { jobsApi } from "@/features/jobs/api";
import { useAuth } from "@/features/auth/use-auth";
import { QUERY_KEYS } from "@/lib/api/query-keys";
import { useTranslation } from "@/lib/i18n/i18n-context";

const CATEGORY_ICON_MAP: Record<string, typeof Wrench> = {
  plumbing: Wrench,
  electrical: Zap,
  carpentry: Hammer,
  painting: Paintbrush,
  cleaning: Sparkles,
  appliances: Tv,
  masonry: Building2,
};

const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED", "EXPIRED"];
const ATTENTION_STATUSES = ["OFFERED", "DISPUTED"];

function greetingFor(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function CustomerHomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  // Time-based greeting is client-only (server prerender would embed its own
  // clock and cause a hydration mismatch).
  const [greeting, setGreeting] = useState("Welcome");
  useEffect(() => {
    setGreeting(greetingFor(new Date().getHours()));
  }, []);

  const { data: jobs, isLoading } = useQuery({
    queryKey: QUERY_KEYS.JOBS.LIST({ role: "customer" }),
    queryFn: () => jobsApi.getJobs(),
  });

  const { data: realCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["service-categories"],
    queryFn: jobsApi.getCategories,
  });

  const allJobs = jobs ?? [];
  const activeJobs = allJobs.filter((j) => !TERMINAL_STATUSES.includes(j.status));
  const attentionJobs = activeJobs.filter((j) => ATTENTION_STATUSES.includes(j.status));
  const recentJobs = allJobs.slice(0, 5);
  const lastPlace = allJobs[0]
    ? [allJobs[0].location.locality, allJobs[0].location.city].filter(Boolean).join(", ")
    : "";

  // Filter only active categories
  const activeCategories = realCategories.filter((c) => c.active !== false);

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            {greeting}, {user?.fullName?.trim()?.split(/\s+/)[0] ?? "there"}
          </h1>
          <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span>{lastPlace || "Panaji, Goa"}</span>
          </div>
        </div>
        <Button asChild className="w-fit rounded-lg font-semibold sm:w-auto shadow-xs">
          <Link href="/customer/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Book Service
          </Link>
        </Button>
      </div>

      {/* Needs your attention — only rendered when something needs action */}
      {attentionJobs.length > 0 && (
        <section aria-labelledby="attention-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h2 id="attention-title" className="text-base font-semibold text-foreground">
              Needs your attention
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {attentionJobs.map((job) => (
              <Link
                key={job.id}
                href={`/customer/jobs/${job.id}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 transition-colors hover:bg-amber-500/10"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{job.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {job.status === "DISPUTED" ? "Dispute opened — review required" : "Offer received — respond to continue"}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Active service */}
      {activeJobs.length > 0 && (
        <section aria-labelledby="active-service-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <h2 id="active-service-title" className="text-base font-semibold text-foreground">
              Active service
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {activeJobs.map((job) => (
              <Card key={job.id} className="rounded-xl border-border shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={job.status} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="mt-2 line-clamp-1 text-base font-semibold text-foreground">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-1 text-xs text-muted-foreground">
                    {job.location.locality}, {job.location.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {job.worker ? (
                    <div className="flex items-center gap-2 text-xs font-medium text-foreground">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                      <span>{job.worker.name}</span>
                      {typeof job.worker.rating === "number" && (
                        <span className="text-muted-foreground">· {job.worker.rating.toFixed(1)} ★</span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Matching nearby technicians…</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button asChild variant="outline" size="sm" className="flex-1 rounded-lg text-xs font-medium">
                      <Link href={`/customer/jobs/${job.id}`}>
                        View service
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    <Button asChild variant="secondary" size="sm" className="rounded-lg text-xs font-medium">
                      <Link href={`/messages?job=${job.id}`}>
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                        Message
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Services (real categories from the API) */}
      <section aria-labelledby="categories-title" className="space-y-4">
        <h2 id="categories-title" className="text-base font-semibold tracking-tight text-foreground">
          Services
        </h2>

        {isLoadingCategories ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-24 animate-pulse rounded-xl bg-muted/60" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {activeCategories.map((cat) => {
              const slugKey = cat.slug.toLowerCase();
              const Icon =
                CATEGORY_ICON_MAP[slugKey] ||
                Object.entries(CATEGORY_ICON_MAP).find(([key]) => slugKey.includes(key))?.[1] ||
                Wrench;

              return (
                <Link
                  key={cat.id}
                  href={`/customer/jobs/new?category=${encodeURIComponent(cat.id)}`}
                  className="group flex flex-col items-center justify-center rounded-xl border border-border bg-card p-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <div className="mb-2.5 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" aria-hidden />
                  </div>
                  <span className="text-sm font-medium text-foreground">{cat.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent services */}
      <section aria-labelledby="recent-services-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="recent-services-title" className="text-base font-semibold tracking-tight text-foreground">
            {t("customer.myBookings", "Recent services")}
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs font-medium">
            <Link href="/customer/jobs">View all</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : recentJobs.length === 0 ? (
          <div className="space-y-3 rounded-xl border border-dashed p-8 text-center text-muted-foreground">
            <p className="text-sm">You haven&apos;t created any service requests yet.</p>
            <Button asChild size="sm" className="rounded-lg">
              <Link href="/customer/jobs/new">Create your first request</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentJobs.map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-card p-4 transition-colors hover:bg-muted/40"
              >
                <Link href={`/customer/jobs/${job.id}`} className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{job.title}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.category} • {job.location.locality}, {job.location.city}
                  </p>
                </Link>
                <div className="flex shrink-0 items-center gap-3 text-right">
                  <div>
                    {job.estimatedPrice ? (
                      <PriceDisplay amount={job.estimatedPrice} className="text-sm font-semibold" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Custom quote</span>
                    )}
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {TERMINAL_STATUSES.includes(job.status) && (
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="hidden rounded-lg text-xs font-medium sm:inline-flex"
                    >
                      <Link href={`/customer/jobs/new?category=${encodeURIComponent(job.category)}`}>
                        <RefreshCw className="mr-1.5 h-3 w-3" />
                        Book again
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
