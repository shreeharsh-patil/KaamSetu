"use client";

import { use, useState, useEffect, useCallback } from "react";
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
  Loader2,
  RefreshCw,
  Edit3,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { jobsApi } from "@/features/jobs/api";
import { QUERY_KEYS } from "@/lib/api/query-keys";
import { writeJobDraft } from "@/features/customer/draft-storage";
import { getSocket, connectSocket } from "@/lib/socket/socket-client";

export default function JobMatchingPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState<number | null>(null);
  const cancelReason = "Found alternative solution";

  // 1. Fetch authoritative job details
  const {
    data: job,
    isLoading: isJobLoading,
    error: jobError,
    refetch: refetchJob,
  } = useQuery({
    queryKey: QUERY_KEYS.JOBS.DETAIL(jobId),
    queryFn: () => jobsApi.getJobById(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "OPEN" || status === "MATCHING" || status === "OFFERED") {
        return 5000;
      }
      return false;
    },
  });

  // 2. Fetch live matching status and diagnostics
  const {
    data: matchingStatus,
    refetch: refetchMatchingStatus,
  } = useQuery({
    queryKey: ["jobs", jobId, "matching-status"],
    queryFn: () => jobsApi.getJobMatchingStatus(jobId),
    enabled: Boolean(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "OPEN" || status === "MATCHING" || status === "OFFERED") {
        return 5000;
      }
      return false;
    },
  });

  // Effective status prioritizes matchingStatus if available, else job.status
  const currentStatus = matchingStatus?.status ?? job?.status;

  // 3. Socket.IO Realtime Room Subscription & Event Sync
  useEffect(() => {
    connectSocket();
    const socket = getSocket();

    const handleStatusChanged = (data?: { jobId?: string }) => {
      if (!data?.jobId || data.jobId === jobId) {
        void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(jobId) });
        void queryClient.invalidateQueries({ queryKey: ["jobs", jobId, "matching-status"] });
      }
    };

    // Join the job's realtime room
    socket.emit("join:job", { jobId });
    socket.on("job.status.changed", handleStatusChanged);
    socket.on("job.accepted", handleStatusChanged);

    return () => {
      socket.off("job.status.changed", handleStatusChanged);
      socket.off("job.accepted", handleStatusChanged);
      socket.emit("leave:job", { jobId });
    };
  }, [jobId, queryClient]);

  // 4. Authoritative visual countdown timer
  useEffect(() => {
    if (matchingStatus?.matching?.remainingSeconds !== undefined) {
      setCountdownSeconds(matchingStatus.matching.remainingSeconds);
    } else if (matchingStatus?.matching?.expiresAt) {
      const diff = Math.max(
        0,
        Math.floor((new Date(matchingStatus.matching.expiresAt).getTime() - Date.now()) / 1000)
      );
      setCountdownSeconds(diff);
    }
  }, [matchingStatus?.matching?.remainingSeconds, matchingStatus?.matching?.expiresAt]);

  useEffect(() => {
    if (
      countdownSeconds === null ||
      countdownSeconds <= 0 ||
      currentStatus === "ACCEPTED" ||
      currentStatus === "EXPIRED" ||
      currentStatus === "CANCELLED"
    ) {
      return;
    }

    const timer = setInterval(() => {
      setCountdownSeconds((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownSeconds, currentStatus]);

  // 5. Job cancellation mutation
  const cancelMutation = useMutation({
    mutationFn: () => jobsApi.cancelJob(jobId, cancelReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(jobId) });
      queryClient.invalidateQueries({ queryKey: ["jobs", jobId, "matching-status"] });
      router.push("/customer/jobs");
    },
  });

  // 6. Actionable recovery: Pre-fill draft and navigate to job creation wizard
  const handleTryAgain = useCallback(() => {
    if (!job) {
      router.push("/customer/jobs/new");
      return;
    }

    writeJobDraft({
      categoryId: job.categoryId,
      category: job.category,
      requiredSkills: job.requiredSkills ?? [],
      title: job.title,
      description: job.description,
      urgency: job.urgency,
      locality: job.location.locality,
      city: job.location.city,
      addressLine: job.location.addressLine,
      state: job.location.state,
      pincode: job.location.pincode,
      latitude: job.location.latitude,
      longitude: job.location.longitude,
      estimatedPrice: job.estimatedPrice,
    });

    router.push("/customer/jobs/new");
  }, [job, router]);

  const handleManualRefresh = useCallback(() => {
    void refetchJob();
    void refetchMatchingStatus();
  }, [refetchJob, refetchMatchingStatus]);

  if (isJobLoading) {
    return (
      <Container className="py-12 max-w-lg text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Connecting to matching engine...</p>
      </Container>
    );
  }

  if (jobError || !job) {
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
    ].includes(currentStatus ?? "")
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

  const isMatchingActive =
    currentStatus === "OPEN" ||
    currentStatus === "MATCHING" ||
    currentStatus === "OFFERED";

  const isLongRunning =
    isMatchingActive && countdownSeconds !== null && countdownSeconds <= 0;

  const formatTimer = (seconds: number | null): string => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const outcomeReason = matchingStatus?.outcomeReason;
  const getExpiredDescription = () => {
    switch (outcomeReason) {
      case "NO_ELIGIBLE_WORKERS":
        return "No verified professionals matching your category are currently available in this locality. Try adjusting your service location or scheduling for a later slot.";
      case "ALL_ELIGIBLE_WORKERS_EXHAUSTED":
        return "Nearby professionals were sent offers but were unavailable to accept at this time. You can try adjusting your job time or price.";
      case "MATCHING_TIMEOUT":
        return "The search window has elapsed without an available pro. You can retry with adjusted requirements or schedule for a different time.";
      default:
        return "No professionals were able to accept your booking before the search window closed. Please try posting again.";
    }
  };

  return (
    <Container className="py-8 max-w-xl space-y-6">
      {/* Top Failsafe Banner: Shown if elapsed beyond deadline but state hasn't updated yet */}
      {isLongRunning && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-amber-700 dark:text-amber-400 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>This search is taking longer than expected.</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              className="h-8 text-xs gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Refresh Status
            </Button>
          </div>
        </div>
      )}

      {/* Main Matching Card */}
      <Card className="overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Badge
              variant={currentStatus === "EXPIRED" ? "destructive" : "outline"}
              className="uppercase tracking-wider text-[11px]"
            >
              {currentStatus === "EXPIRED"
                ? "Matching Concluded"
                : currentStatus === "OFFERED"
                ? "Offers Dispatched"
                : "Matching in Progress"}
            </Badge>

            {isMatchingActive && countdownSeconds !== null && (
              <Badge variant="secondary" className="font-mono text-[11px] gap-1">
                <Clock className="h-3 w-3" />
                {formatTimer(countdownSeconds)}
              </Badge>
            )}
          </div>

          <CardTitle className="text-2xl font-bold">{job.title}</CardTitle>
          <CardDescription>
            {job.category} • {job.location.locality}, {job.location.city}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 py-6 text-center">
          {/* STATE 1: OPEN / MATCHING */}
          {(currentStatus === "OPEN" || currentStatus === "MATCHING") && (
            <div className="space-y-4">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-primary/40 animate-pulse" />
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Radar className="h-8 w-8 animate-spin" />
                </div>
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">Scanning Nearby Area...</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Searching for available, verified professionals matching your category and location.
                </p>
              </div>
            </div>
          )}

          {/* STATE 2: OFFERED (Single merged, informative card) */}
          {currentStatus === "OFFERED" && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center mx-auto text-blue-600">
                <Users className="h-10 w-10 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">Professionals Notified</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {matchingStatus?.matching?.currentWave ? (
                    <span>
                      Wave {matchingStatus.matching.currentWave} of {matchingStatus.matching.maxWaves || 3}:{" "}
                    </span>
                  ) : null}
                  Job offers dispatched to top-ranked professionals in your area. Awaiting response.
                </p>
              </div>
            </div>
          )}

          {/* STATE 3: EXPIRED (Single merged, clean terminal card) */}
          {currentStatus === "EXPIRED" && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">No Available Professional Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {getExpiredDescription()}
                </p>
              </div>
            </div>
          )}

          {/* STATE 4: CANCELLED */}
          {currentStatus === "CANCELLED" && (
            <div className="space-y-4">
              <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto text-destructive">
                <AlertCircle className="h-10 w-10" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-foreground text-lg">Request Cancelled</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  This service request was cancelled. You can start a new request at any time.
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
            {matchingStatus?.matching?.offersSent ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Offers Sent:</span>
                <span className="font-medium text-foreground">
                  {matchingStatus.matching.offersSent}
                </span>
              </div>
            ) : null}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          {currentStatus === "EXPIRED" ? (
            <div className="w-full space-y-2">
              <Button onClick={handleTryAgain} className="w-full gap-2">
                <RotateCcw className="h-4 w-4" /> Try Again with Pre-filled Request
              </Button>
              <Button asChild variant="outline" className="w-full gap-2">
                <Link href="/customer/jobs">
                  <Edit3 className="h-4 w-4" /> Back to My Bookings
                </Link>
              </Button>
            </div>
          ) : currentStatus === "CANCELLED" ? (
            <Button asChild className="w-full">
              <Link href="/customer/jobs/new">Create New Request</Link>
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
