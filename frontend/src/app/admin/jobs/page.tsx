"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Eye, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { adminApi } from "@/features/admin/api";
import type { JobStatus } from "@/features/jobs/types";

export default function AdminJobsMonitorPage() {
  const [statusFilter, setStatusFilter] = useState("");

  const { data: jobs = [], isLoading, error } = useQuery({
    queryKey: ["admin", "jobs", statusFilter],
    queryFn: () => adminApi.getJobs(statusFilter),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Platform Jobs Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            Real-time tracking of service requests across all categories
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["", "OPEN", "MATCHING", "OFFERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"].map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="text-xs"
            >
              {s || "All Stages"}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-muted/40 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 text-center text-destructive text-sm flex items-center justify-center gap-2">
              <AlertCircle className="h-4 w-4" /> Failed to load jobs.
            </div>
          ) : jobs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">
              No jobs found matching the selected status.
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[700px]">
              <thead className="border-b bg-muted/40 text-xs font-semibold text-muted-foreground uppercase">
                <tr>
                  <th className="p-4">Job Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Worker</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Locality</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-4 font-semibold text-foreground max-w-xs truncate">
                      {job.title}
                    </td>
                    <td className="p-4 text-xs capitalize text-muted-foreground">{job.category}</td>
                    <td className="p-4 text-xs font-medium text-foreground">{job.customerName}</td>
                    <td className="p-4 text-xs text-muted-foreground">
                      {job.workerName || "Unassigned"}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={job.status as JobStatus} />
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{job.locality}</td>
                    <td className="p-4 text-right">
                      <Button asChild variant="ghost" size="sm" className="h-8 text-xs">
                        <Link href={`/customer/jobs/${job.id}`}>
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
