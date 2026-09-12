"use client";

import Link from "next/link";
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
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { jobsApi } from "@/features/jobs/api";
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

export default function CustomerHomePage() {
  const { t } = useTranslation();

  const { data: jobs, isLoading } = useQuery({
    queryKey: QUERY_KEYS.JOBS.LIST({ role: "customer" }),
    queryFn: () => jobsApi.getJobs(),
  });

  const { data: realCategories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["service-categories"],
    queryFn: jobsApi.getCategories,
  });

  const activeJobs = jobs?.filter(
    (j) => !["COMPLETED", "CANCELLED", "EXPIRED"].includes(j.status)
  ) ?? [];

  // Filter only active categories
  const activeCategories = realCategories.filter((c) => c.active !== false);

  return (
    <Container className="py-6 space-y-8 max-w-6xl">
      {/* 1. Restrained Top Toolbar / Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-border bg-card">
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground">
            Customer Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Book local services, track requests, and manage your household tasks.
          </p>
        </div>

        <Button asChild size="default" className="sm:w-auto bg-[#162044] hover:bg-[#203eec] text-white font-medium rounded-lg">
          <Link href="/customer/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            Book a Service
          </Link>
        </Button>
      </div>

      {/* 2. Active Job Alert (if any active jobs exist) */}
      {activeJobs.length > 0 && (
        <section aria-labelledby="active-requests-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[#203eec] dark:text-blue-400" />
            <h2 id="active-requests-title" className="text-base font-semibold text-foreground">
              Active Service Requests ({activeJobs.length})
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {activeJobs.map((job) => (
              <Card key={job.id} className="border-border rounded-xl shadow-none">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={job.status} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2 line-clamp-1 font-semibold text-foreground">
                    {job.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-1 text-xs text-muted-foreground">
                    {job.location.locality}, {job.location.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {job.worker ? (
                    <div className="flex items-center gap-2 text-xs text-foreground font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>Assigned worker: {job.worker.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400 font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Matching nearby technicians...</span>
                    </div>
                  )}

                  <Button asChild variant="outline" size="sm" className="w-full rounded-lg text-xs font-medium">
                    <Link
                      href={
                        job.status === "OPEN" || job.status === "MATCHING" || job.status === "OFFERED"
                          ? `/customer/jobs/${job.id}/matching`
                          : `/customer/jobs/${job.id}`
                      }
                    >
                      Track Job Details
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 3. Service Categories (Real API data) */}
      <section aria-labelledby="categories-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="categories-title" className="text-lg font-semibold tracking-tight text-foreground">
              Select a Trade
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Choose a category to start your booking request
            </p>
          </div>
          <Link
            href="/customer/jobs/new"
            className="text-xs sm:text-sm font-medium text-[#203eec] dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            Custom request <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {isLoadingCategories ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-24 rounded-xl bg-muted/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
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
                  className="group flex flex-col items-center justify-center p-4 rounded-xl border border-border/80 bg-card hover:border-[#203eec]/40 hover:bg-secondary/40 transition-colors text-center"
                >
                  <div className="w-10 h-10 rounded-lg mb-2.5 bg-[#203eec]/10 text-[#203eec] dark:text-blue-400 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {cat.name}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Recent Jobs / Bookings */}
      <section aria-labelledby="recent-bookings-title" className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 id="recent-bookings-title" className="text-lg font-semibold tracking-tight text-foreground">
            {t("customer.myBookings", "Recent Requests")}
          </h2>
          <Button asChild variant="ghost" size="sm" className="text-xs font-medium">
            <Link href="/customer/jobs">View all</Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-dashed text-muted-foreground space-y-3">
            <p className="text-sm">You haven&apos;t created any service requests yet.</p>
            <Button asChild size="sm" className="rounded-lg">
              <Link href="/customer/jobs/new">Create Your First Request</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <Link
                key={job.id}
                href={`/customer/jobs/${job.id}`}
                className="flex items-center justify-between p-4 rounded-xl border border-border/70 bg-card hover:bg-secondary/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-foreground">{job.title}</span>
                    <StatusBadge status={job.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.category} • {job.location.locality}, {job.location.city}
                  </p>
                </div>
                <div className="text-right">
                  {job.estimatedPrice ? (
                    <PriceDisplay amount={job.estimatedPrice} className="font-semibold text-sm" />
                  ) : (
                    <span className="text-xs text-muted-foreground">Custom Quote</span>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </Container>
  );
}
