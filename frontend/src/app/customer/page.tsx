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
  ShieldCheck,
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

const CATEGORIES = [
  { id: "plumbing", name: "Plumbing", icon: Wrench, color: "text-blue-600 bg-blue-50" },
  { id: "electrical", name: "Electrical", icon: Zap, color: "text-amber-600 bg-amber-50" },
  { id: "carpentry", name: "Carpentry", icon: Hammer, color: "text-orange-600 bg-orange-50" },
  { id: "painting", name: "Painting", icon: Paintbrush, color: "text-purple-600 bg-purple-50" },
  { id: "cleaning", name: "Cleaning", icon: Sparkles, color: "text-emerald-600 bg-emerald-50" },
  { id: "appliances", name: "Appliances", icon: Tv, color: "text-rose-600 bg-rose-50" },
  { id: "masonry", name: "Masonry", icon: Building2, color: "text-slate-600 bg-slate-100" },
];

export default function CustomerHomePage() {
  const { t } = useTranslation();
  const { data: jobs, isLoading } = useQuery({
    queryKey: QUERY_KEYS.JOBS.LIST({ role: "customer" }),
    queryFn: () => jobsApi.getJobs(),
  });

  const activeJobs = jobs?.filter(
    (j) => !["COMPLETED", "CANCELLED", "EXPIRED"].includes(j.status)
  ) ?? [];

  return (
    <Container className="py-6 space-y-8">
      {/* Top Banner & Quick Action (KaamBazaar Deep Royal Navy Banner) */}
      <div className="rounded-3xl hero-navy-card p-6 sm:p-8 shadow-lg border border-primary/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2.5 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white border border-white/20 text-xs font-semibold backdrop-blur-sm">
            <span>⚡ Fast Local Services</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
            {t("customer.bannerTitle", "Reliable Workers, Right Now.")}
          </h1>
          <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
            {t("customer.bannerSub", "Connect with verified plumbers, electricians, carpenters, and painters near you. Transparent fares and safe completion OTP.")}
          </p>
        </div>
        <Button asChild size="lg" className="w-full md:w-auto bg-white text-[#162044] hover:bg-white/90 font-bold rounded-xl shadow-xs">
          <Link href="/customer/jobs/new">
            <PlusCircle className="mr-2 h-5 w-5" />
            {t("customer.bookNow", "Book a Service Now")}
          </Link>
        </Button>
      </div>

      {/* Active Job Alert Card if exists */}
      {activeJobs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Active Service Request
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {activeJobs.slice(0, 2).map((job) => (
              <Card key={job.id} className="border-primary/40 shadow-xs rounded-2xl overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={job.status} />
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-base mt-2 line-clamp-1 font-bold">{job.title}</CardTitle>
                  <CardDescription className="line-clamp-1 text-xs">
                    {job.location.locality}, {job.location.city}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3 text-sm">
                  {job.worker ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-foreground text-xs sm:text-sm">{job.worker.name}</span>
                      <span className="text-xs text-muted-foreground">assigned</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 text-xs sm:text-sm font-medium">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Matching with nearby workers...</span>
                    </div>
                  )}
                </CardContent>
                <div className="px-6 pb-4 pt-0">
                  <Button asChild variant="outline" size="sm" className="w-full rounded-xl font-semibold">
                    <Link
                      href={
                        job.status === "OPEN" || job.status === "MATCHING" || job.status === "OFFERED"
                          ? `/customer/jobs/${job.id}/matching`
                          : `/customer/jobs/${job.id}`
                      }
                    >
                      Track Job Progress <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Service Categories Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">Need help with something?</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">Choose a service to get started</p>
          </div>
          <Link
            href="/customer/jobs/new"
            className="text-xs sm:text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            All Services <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <Link
                key={cat.id}
                href={`/customer/jobs/new?category=${cat.id}`}
                className="group flex flex-col items-center justify-center p-4 rounded-2xl border border-border/70 bg-card hover:bg-muted/40 hover:border-primary/40 transition-all text-center shadow-2xs"
              >
                <div className={`p-3.5 rounded-2xl mb-2.5 ${cat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-bold text-foreground group-hover:text-primary">
                  {t(`category.${cat.id}`, cat.name)}
                </span>
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  Instant Match
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Trust & Guarantee Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
          <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{t("home.trustBg", "Verified Professionals")}</h3>
            <p className="text-xs text-muted-foreground">
              Government ID verified & skill-tested local professionals.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
          <Clock className="h-8 w-8 text-primary shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{t("home.statDispatch", "Fast Dispatch")}</h3>
            <p className="text-xs text-muted-foreground">
              Nearby workers respond within 15 minutes of posting.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-xl border bg-card">
          <CheckCircle2 className="h-8 w-8 text-primary shrink-0" />
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{t("home.trustOtp", "Safe OTP Completion")}</h3>
            <p className="text-xs text-muted-foreground">
              Job is completed only when you share the completion OTP.
            </p>
          </div>
        </div>
      </div>

      {/* Recent Jobs History Preview */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-foreground">{t("customer.myBookings", "Recent Bookings")}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/customer/jobs">{t("home.allTrades", "View all")}</Link>
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
            <p>You haven&apos;t created any service requests yet.</p>
            <Button asChild size="sm">
              <Link href="/customer/jobs/new">Create Your First Request</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {jobs.slice(0, 5).map((job) => (
              <Link
                key={job.id}
                href={`/customer/jobs/${job.id}`}
                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">{job.title}</span>
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
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(job.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
