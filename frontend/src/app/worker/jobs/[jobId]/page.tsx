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
  AlertTriangle,
  Receipt,
  MapPin,
  Sparkles,
  Star,
  Loader2,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { JobTimeline } from "@/components/shared/job-timeline";
import { jobsApi } from "@/features/jobs/api";
import { reviewsApi } from "@/features/reviews/api";
import { QUERY_KEYS } from "@/lib/api/query-keys";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function WorkerActiveJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const queryClient = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.JOBS.DETAIL(jobId),
    queryFn: () => jobsApi.getJobById(jobId),
    refetchInterval: 4000,
  });

  const advanceMutation = useMutation({
    mutationFn: (action: "start-travel" | "arrive" | "start" | "complete") =>
      jobsApi.advanceJobState(jobId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(jobId) });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => reviewsApi.submitReview(jobId, {
      overallRating: rating,
      qualityRating: rating,
      punctualityRating: rating,
      communicationRating: rating,
      comment: comment.trim(),
    }),
    onSuccess: () => {
      setReviewSubmitted(true);
      setReviewError(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(jobId) });
    },
    onError: (error: unknown) => {
      setReviewError(error instanceof Error ? error.message : "Unable to submit your review. Please try again.");
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
            <p className="text-xs text-muted-foreground">Reference #{job.id.slice(-8)}</p>
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
              <div className="flex flex-col sm:flex-row gap-2">
                <Button asChild variant="outline" className="w-full sm:flex-1">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${job.location.latitude},${job.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="mr-2 h-4 w-4" /> Open Maps Navigation
                  </a>
                </Button>
                <Button
                  className="w-full sm:flex-1"
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
                Confirm with the customer that work can begin, then start the job.
              </p>
              <Button
                size="lg"
                className="w-full"
                disabled={advanceMutation.isPending}
                onClick={() => advanceMutation.mutate("start")}
              >
                Begin Work
              </Button>
            </div>
          )}

          {job.status === "IN_PROGRESS" && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                Work in progress. Complete only after the customer has inspected the work.
              </p>
              <Button
                size="lg"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={advanceMutation.isPending}
                onClick={() => advanceMutation.mutate("complete")}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" /> Complete Job
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
                <Link href={`/worker/earnings?jobId=${job.id}`}>
                  <Receipt className="mr-2 h-4 w-4" /> Log Job Expense / Materials
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setReviewError(null);
                  setReviewSubmitted(false);
                  setReviewOpen(true);
                }}
              >
                <Star className="mr-2 h-4 w-4" /> Rate customer
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
                <a href={job.customer.phone ? `tel:${job.customer.phone}` : undefined} aria-disabled={!job.customer.phone}>
                  <Phone className="mr-1 h-3.5 w-3.5" /> Call
                </a>
              </Button>
              <Button asChild size="sm">
                <Link href={`/messages/${job.id}`}>
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

      <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate your customer</DialogTitle>
            <DialogDescription>
              Share feedback about this completed service experience.
            </DialogDescription>
          </DialogHeader>

          {reviewSubmitted ? (
            <div className="py-6 text-center space-y-2">
              <Sparkles className="h-10 w-10 text-emerald-600 mx-auto" />
              <p className="font-semibold">Your review has been submitted.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {reviewError ? (
                <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {reviewError}
                </p>
              ) : null}
              <fieldset>
                <legend className="text-sm font-medium text-foreground">Overall rating</legend>
                <div className="mt-2 flex gap-1" aria-label="Overall rating">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-label={`${value} star${value === 1 ? "" : "s"}`}
                      aria-pressed={value === rating}
                      onClick={() => setRating(value)}
                      className="rounded p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Star className={`h-7 w-7 ${value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35"}`} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="space-y-1.5">
                <label htmlFor="customer-review-comment" className="text-sm font-medium text-foreground">
                  Comment <span className="text-muted-foreground">(optional)</span>
                </label>
                <Textarea
                  id="customer-review-comment"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  maxLength={1000}
                  placeholder="Tell us about your experience."
                  rows={4}
                />
              </div>
            </div>
          )}

          {!reviewSubmitted ? (
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewOpen(false)}>Cancel</Button>
              <Button disabled={submitReviewMutation.isPending} onClick={() => submitReviewMutation.mutate()}>
                {submitReviewMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit review"}
              </Button>
            </DialogFooter>
          ) : null}
        </DialogContent>
      </Dialog>

    </Container>
  );
}
