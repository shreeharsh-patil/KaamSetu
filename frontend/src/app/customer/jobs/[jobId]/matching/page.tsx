"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Radar,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  XCircle,
  Loader2,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { jobsApi } from "@/features/jobs/api";
import { QUERY_KEYS } from "@/lib/api/query-keys";

export default function JobMatchingPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const cancelReason = "Found alternative solution";

  const { data: job, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.JOBS.DETAIL(jobId),
    queryFn: () => jobsApi.getJobById(jobId),
    // Poll every 3 seconds while matching to stay in sync with backend
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (
        status === "OPEN" ||
        status === "MATCHING" ||
        status === "OFFERED"
      ) {
        return 3000;
      }
      return false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => jobsApi.cancelJob(jobId, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(jobId) });
      router.push("/customer/jobs");
    },
  });

  if (isLoading) {
    return (
      <Container className="py-12 max-w-lg text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Connecting to matching engine...</p>
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container className="py-12 max-w-lg text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Failed to load matching status</h2>
        <p className="text-sm text-muted-foreground">The request ID may be invalid or expired.</p>
        <Button asChild>
          <Link href="/customer/jobs">Back to Bookings</Link>
        </Button>
      </Container>
    );
  }

  // If already assigned or progressing, redirect to active job view
  if (
    [
      "ACCEPTED",
      "EN_ROUTE",
      "ARRIVED",
      "IN_PROGRESS",
      "COMPLETED",
    ].includes(job.status)
  ) {
    return (
      <Container className="py-12 max-w-md">
        <Card className="border-emerald-500/30 bg-emerald-500/5 text-center p-6 space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto text-emerald-600">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-foreground">Worker Confirmed!</h2>
            <p className="text-sm text-muted-foreground">
              {job.worker?.name ?? "A professional"} has accepted your request.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link href={`/customer/jobs/${job.id}`}>
              Proceed to Live Tracking <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-8 max-w-xl space-y-6">
      {/* Top Header Card */}
      <Card className="overflow-hidden">
        <CardHeader className="text-center pb-2">
          <Badge variant="outline" className="mx-auto uppercase tracking-wider text-[11px] mb-2">
            Matching in Progress
          </Badge>
          <CardTitle className="text-2xl font-bold">{job.title}</CardTitle>
          <CardDescription>
            {job.category} • {job.location.locality}, {job.location.city}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 py-6 text-center">
          {/* Radar animation based on state */}
          {(job.status === "OPEN" || job.status === "MATCHING") && (
            <div className="space-y-4">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-primary/40 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Radar className="h-8 w-8 animate-spin" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">Scanning Nearby Radius...</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Alerting top-rated verified professionals within 5 km of your locality.
                </p>
              </div>
            </div>
          )}

          {job.status === "OFFERED" && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto text-blue-600">
                <Users className="h-10 w-10 animate-bounce" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">Workers Located Nearby!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Multiple available professionals are reviewing your job requirements right now.
                </p>
              </div>
            </div>
          )}

          {job.status === "OFFERED" && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-50 dark:bg-amber-950 flex items-center justify-center mx-auto text-amber-600">
                <Clock className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">Offer Dispatched</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Awaiting worker confirmation. If not accepted within 60s, will route to next best pro.
                </p>
              </div>
            </div>
          )}

          {job.status === "EXPIRED" && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <AlertCircle className="h-10 w-10 text-amber-500" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">No Nearby Pros Available</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  All workers in your area are currently busy. Try scheduling for a later slot or expanding search radius.
                </p>
              </div>
            </div>
          )}

          {job.status === "EXPIRED" && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
                <XCircle className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">Matching Request Expired</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  No response was received within the booking window.
                </p>
              </div>
            </div>
          )}

          {/* Booking Summary Box */}
          <div className="p-4 rounded-xl bg-muted/40 border text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Job Reference:</span>
              <span className="font-mono font-medium">#{job.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Urgency:</span>
              <Badge variant="outline" className="text-[10px] uppercase">
                {job.urgency}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Service Locality:</span>
              <span className="font-medium text-foreground">{job.location.locality}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          {job.status === "EXPIRED" ? (
            <Button asChild className="w-full">
              <Link href="/customer/jobs/new">
                <RotateCcw className="mr-2 h-4 w-4" /> Try Posting Again
              </Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setCancelModalOpen(true)}
            >
              Cancel Request
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Trust reassurance */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-4 w-4 text-primary" />
        <span>No cancellation fee charged while matching is in progress.</span>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="Cancel Service Request?"
        description="Are you sure you want to stop looking for a worker? We'll stop broadcasting your request to nearby professionals."
        confirmText={cancelMutation.isPending ? "Cancelling..." : "Yes, Cancel Request"}
        variant="destructive"
        onConfirm={() => cancelMutation.mutate()}
      />
    </Container>
  );
}
