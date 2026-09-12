"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Navigation,
  CheckCircle2,
  Car,
  KeyRound,
  AlertTriangle,
  Loader2,
  Receipt,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/status-badge";
import { JobTimeline } from "@/components/shared/job-timeline";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { jobsApi } from "@/features/jobs/api";
import { QUERY_KEYS } from "@/lib/api/query-keys";

export default function WorkerActiveJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const queryClient = useQueryClient();

  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpType, setOtpType] = useState<"start" | "complete">("start");
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);

  const { data: job, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.JOBS.DETAIL(jobId),
    queryFn: () => jobsApi.getJobById(jobId),
    refetchInterval: 4000,
  });

  const advanceMutation = useMutation({
    mutationFn: (action: "start-travel" | "arrive" | "start-work" | "complete") =>
      jobsApi.advanceJobState(jobId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(jobId) });
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => jobsApi.verifyOtp(jobId, otpValue, otpType),
    onSuccess: () => {
      setOtpModalOpen(false);
      setOtpValue("");
      setOtpError(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(jobId) });
    },
    onError: () => {
      setOtpError("Invalid OTP. Please ask the customer for the correct 4-digit code.");
    },
  });

  if (isLoading) {
    return (
      <Container className="py-12 max-w-2xl space-y-4">
        <div className="h-44 rounded-2xl bg-muted/40 animate-pulse border" />
        <div className="h-64 rounded-2xl bg-muted/40 animate-pulse border" />
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container className="py-12 max-w-lg text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Job Not Found</h2>
        <p className="text-sm text-muted-foreground">This job ID is invalid or has been cancelled.</p>
        <Button asChild>
          <Link href="/worker">Back to Dashboard</Link>
        </Button>
      </Container>
    );
  }

  const handleOpenOtpModal = (type: "start" | "complete") => {
    setOtpType(type);
    setOtpValue("");
    setOtpError(null);
    setOtpModalOpen(true);
  };

  const isCompleted = job.status === "COMPLETED";

  return (
    <Container className="py-6 max-w-2xl space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/worker">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-xs text-muted-foreground">Reference #{job._id.slice(-8)}</p>
          </div>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <Card className="p-4">
        <JobTimeline status={job.status} />
      </Card>

      {/* Primary Action Button Bar based on current backend status */}
      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Current Stage Action
            </span>
            <Badge variant="outline" className="font-bold text-[11px]">
              {job.status}
            </Badge>
          </div>

          {job.status === "ACCEPTED" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                You have accepted this job. Tap below when you are packing tools and heading toward the customer location.
              </p>
              <Button
                size="lg"
                className="w-full"
                disabled={advanceMutation.isPending}
                onClick={() => advanceMutation.mutate("start-travel")}
              >
                <Car className="mr-2 h-5 w-5" />
                {advanceMutation.isPending ? "Updating..." : "Start Travel (I'm En Route)"}
              </Button>
            </div>
          )}

          {job.status === "EN_ROUTE" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Customer is notified that you are travelling. Tap below once you reach the premises.
              </p>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${job.location.latitude},${job.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="mr-2 h-4 w-4" /> Open Maps Navigation
                  </a>
                </Button>
                <Button
                  className="flex-1"
                  disabled={advanceMutation.isPending}
                  onClick={() => advanceMutation.mutate("arrive")}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {advanceMutation.isPending ? "Updating..." : "I Have Arrived"}
                </Button>
              </div>
            </div>
          )}

          {job.status === "ARRIVED" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Ask customer for their 4-digit <strong>Start OTP</strong> to verify identity and unlock work.
              </p>
              <Button
                size="lg"
                className="w-full"
                onClick={() => handleOpenOtpModal("start")}
              >
                <KeyRound className="mr-2 h-5 w-5" /> Enter Start OTP & Begin Work
              </Button>
            </div>
          )}

          {job.status === "IN_PROGRESS" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Work in progress. Once you finish repairs, ask the customer to inspect and share the <strong>Completion OTP</strong>.
              </p>
              <Button
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleOpenOtpModal("complete")}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" /> Complete Job with Customer OTP
              </Button>
            </div>
          )}

          {isCompleted && (
            <div className="text-center py-2 space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mx-auto">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-base text-foreground">Job Successfully Completed!</h3>
              <p className="text-xs text-muted-foreground">
                Payment has been credited to your worker balance. You can record any material costs incurred.
              </p>
              <Button asChild variant="outline" className="w-full mt-2">
                <Link href={`/worker/earnings?jobId=${job._id}`}>
                  <Receipt className="mr-2 h-4 w-4" /> Log Job Expense / Materials
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Customer Contact & Unlocked Address Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Customer & Location</CardTitle>
          <CardDescription className="text-xs">
            Unlocked full address and contact details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center justify-between pb-3 border-b">
            <div>
              <h3 className="font-semibold text-foreground text-sm">{job.customer.name}</h3>
              <p className="text-xs text-muted-foreground">Customer</p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={`tel:${job.customer.phone || "9876543210"}`}>
                  <Phone className="mr-1 h-3.5 w-3.5" /> Call
                </a>
              </Button>
              <Button asChild size="sm">
                <Link href={`/messages/${job._id}`}>
                  <MessageSquare className="mr-1 h-3.5 w-3.5" /> Chat
                </Link>
              </Button>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-muted-foreground block">Complete Address</span>
              <p className="font-medium text-xs text-foreground">
                {job.location.addressLine || job.location.locality}, {job.location.city} -{" "}
                {job.location.pincode}
              </p>
              {job.location.landmark && (
                <p className="text-[11px] text-muted-foreground">Landmark: {job.location.landmark}</p>
              )}
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block mb-1">Issue Description</span>
            <p className="text-xs text-foreground bg-muted/40 p-3 rounded-lg whitespace-pre-wrap">
              {job.description}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* OTP Entry Dialog */}
      <Dialog open={otpModalOpen} onOpenChange={setOtpModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {otpType === "start" ? "Verify Start OTP" : "Verify Completion OTP"}
            </DialogTitle>
            <DialogDescription>
              Ask the customer for the 4-digit verification code shown on their screen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <Input
              type="text"
              maxLength={6}
              placeholder="Enter 4-digit OTP"
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ""))}
              className="text-center font-mono text-2xl tracking-widest h-14"
            />
            {otpError && <p className="text-xs text-destructive text-center">{otpError}</p>}
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setOtpModalOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={otpValue.length < 4 || verifyOtpMutation.isPending}
              onClick={() => verifyOtpMutation.mutate()}
            >
              {verifyOtpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Container>
  );
}
