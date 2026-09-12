"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle, Search, Clock, ArrowRight, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { jobsApi } from "@/features/jobs/api";
import { QUERY_KEYS } from "@/lib/api/query-keys";
import type { JobStatus } from "@/features/jobs/types";

export default function CustomerJobsListPage() {
  const [filterTab, setFilterTab] = useState<"ALL" | "ACTIVE" | "COMPLETED" | "CANCELLED">("ALL");
  const [search, setSearch] = useState("");

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.JOBS.LIST({ role: "customer" }),
    queryFn: () => jobsApi.getJobs(),
  });

  const filteredJobs = jobs?.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.category.toLowerCase().includes(search.toLowerCase()) ||
      job.location.locality.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "ACTIVE") {
      return !["COMPLETED", "CANCELLED", "EXPIRED"].includes(job.status);
    }
    if (filterTab === "COMPLETED") {
      return job.status === "COMPLETED";
    }
    if (filterTab === "CANCELLED") {
      return ["CANCELLED", "EXPIRED"].includes(job.status);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Service Requests</h1>
          <p className="text-sm text-muted-foreground">
            Track ongoing repairs, view quotes and past completed jobs
          </p>
        </div>
        <Button asChild>
          <Link href="/customer/jobs/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Book New Service
          </Link>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, service or locality..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Tabs
          value={filterTab}
          onValueChange={(val) => setFilterTab(val as typeof filterTab)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-4 w-full sm:w-auto">
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="ACTIVE">Active</TabsTrigger>
            <TabsTrigger value="COMPLETED">Completed</TabsTrigger>
            <TabsTrigger value="CANCELLED">Cancelled</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Job Items List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
          Failed to load your requests. Please refresh or try again later.
        </div>
      ) : !filteredJobs || filteredJobs.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed text-muted-foreground space-y-4">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground">No service requests found</h3>
            <p className="text-xs max-w-sm mx-auto">
              {search
                ? "No jobs match your search keywords."
                : "You don't have any bookings under this filter."}
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/customer/jobs/new">Post a Service Request</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredJobs.map((job) => {
            const isMatching = job.status === "OPEN" || job.status === "MATCHING" || job.status === "OFFERED";
            const targetHref = isMatching
              ? `/customer/jobs/${job.id}/matching`
              : `/customer/jobs/${job.id}`;

            return (
              <Link
                key={job.id}
                href={targetHref}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/40 hover:border-primary/40 transition-all gap-4"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                      {job.title}
                    </span>
                    <StatusBadge status={job.status as JobStatus} />
                    <span className="text-xs text-muted-foreground">
                      ID: #{job.id.slice(-6)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {job.category} • {job.location.locality}, {job.location.city}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                    {job.worker && (
                      <span className="text-foreground font-medium">
                        Worker: {job.worker.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  <div className="sm:text-right">
                    {job.estimatedPrice ? (
                      <PriceDisplay amount={job.estimatedPrice} className="font-bold text-base" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Pending Quote</span>
                    )}
                  </div>
                  <div className="p-2 rounded-full bg-muted/60 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
