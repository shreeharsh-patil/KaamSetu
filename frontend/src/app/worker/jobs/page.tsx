"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, Clock, ArrowRight, Search } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { jobsApi } from "@/features/jobs/api";
import { QUERY_KEYS } from "@/lib/api/query-keys";

export default function WorkerJobsHistoryPage() {
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "COMPLETED">("ALL");
  const [search, setSearch] = useState("");

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.JOBS.LIST({ role: "worker" }),
    queryFn: () => jobsApi.getJobs({ status: "ASSIGNED" }),
  });

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      job.location.locality.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "ACTIVE") {
      return ["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(job.status);
    }
    if (filterTab === "COMPLETED") {
      return job.status === "COMPLETED";
    }
    return true;
  });

  return (
    <Container className="py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">My Jobs & History</h1>
        <p className="text-sm text-muted-foreground">
          View accepted bookings, ongoing assignments, and completed history
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by job title or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs
          value={filterTab}
          onValueChange={(v) => setFilterTab(v as typeof filterTab)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
          Failed to load assignments. Please try again.
        </div>
      ) : !filteredJobs || filteredJobs.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed text-muted-foreground space-y-4">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">No jobs found</h3>
            <p className="text-xs max-w-sm mx-auto">
              Check incoming offers to accept new service requests.
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/worker/offers">Browse Nearby Offers</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => (
            <Link
              key={job.id}
              href={`/worker/jobs/${job.id}`}
              className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                    {job.title}
                  </span>
                  <StatusBadge status={job.status} />
                </div>
                <p className="text-xs text-muted-foreground">
                  Customer: {job.customer.name} • {job.location.locality}, {job.location.city}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(job.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                <div className="sm:text-right">
                  {job.estimatedPrice ? (
                    <PriceDisplay amount={job.estimatedPrice} className="font-bold text-base" />
                  ) : null}
                </div>
                <div className="p-2 rounded-full bg-muted/60 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
