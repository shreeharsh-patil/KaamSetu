"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Clock,
  KeyRound,
  AlertTriangle,
  Star,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/shared/status-badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { JobTimeline } from "@/components/shared/job-timeline";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { jobsApi } from "@/features/jobs/api";
import { QUERY_KEYS } from "@/lib/api/query-keys";

export default function CustomerJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = use(params);
  const queryClient = useQueryClient();
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.JOBS.DETAIL(jobId),
    queryFn: () => jobsApi.getJobById(jobId),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return ["ACCEPTED", "EN_ROUTE", "ARRIVED", "IN_PROGRESS"].includes(s || "") ? 4000 : false;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => jobsApi.cancelJob(jobId, "Cancelled by customer"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.DETAIL(jobId) });
      setCancelModalOpen(false);
    },
  });

  if (isLoading) {
    return (
      <Container className="py-12 max-w-2xl space-y-4">
        <div className="h-48 rounded-2xl bg-muted/40 animate-pulse border" />
        <div className="h-64 rounded-2xl bg-muted/40 animate-pulse border" />
      </Container>
    );
  }

  if (error || !job) {
    return (
      <Container className="py-12 max-w-lg text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Booking Not Found</h2>
        <p className="text-sm text-muted-foreground">This service request does not exist or has been removed.</p>
        <Button asChild>
          <Link href="/customer/jobs">Back to Bookings</Link>
        </Button>
      </Container>
    );
  }

  const isCompleted = job.status === "COMPLETED";
  const isCancelled = job.status === "CANCELLED" || job.status === "EXPIRED";

  return (
    <Container className="py-6 max-w-2xl space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/customer/jobs">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-xs text-muted-foreground">
              Reference #{job._id.slice(-8)} • {job.category}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      <Card className="p-4">
        <JobTimeline status={job.status} />
      </Card>

      {/* Security OTP Verification Card */}
      {!isCompleted && !isCancelled && (
        <Card className="border-primary/40 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2 text-primary">
              <KeyRound className="h-5 w-5" />
              <CardTitle className="text-base">Service Security Verification</CardTitle>
            </div>
            <CardDescription className="text-xs">
              {job.status === "ARRIVED"
                ? "Share this Start OTP with the professional when they arrive at your location:"
                : "Share this Completion OTP ONLY when all work is finished to your satisfaction:"}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center justify-center p-4 bg-background rounded-xl border-2 border-dashed border-primary/40">
              <span className="font-mono text-3xl font-extrabold tracking-widest text-primary">
                {job.status === "ARRIVED" ? "5 8 2 1" : "9 4 3 6"}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Do not share this code over phone or before inspection.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Assigned Professional Card */}
      {job.worker ? (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Assigned Professional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border">
                  <AvatarImage src={job.worker.avatarUrl} alt={job.worker.name} />
                  <AvatarFallback className="font-bold">
                    {job.worker.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-foreground text-sm">{job.worker.name}</h3>
                    {job.worker.isVerified && (
                      <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-foreground">{job.worker.rating.toFixed(1)}</span>
                    <span>({job.worker.totalReviews} reviews)</span>
                  </div>
                </div>
              </div>

              {/* Call and Message buttons */}
              <div className="flex items-center gap-2">
                <Button asChild variant="outline" size="icon">
                  <a href={`tel:${job.worker.phone || "9876543210"}`} aria-label="Call Worker">
                    <Phone className="h-4 w-4 text-foreground" />
                  </a>
                </Button>
                <Button asChild size="icon">
                  <Link href={`/messages/${job._id}`} aria-label="Chat with Worker">
                    <MessageSquare className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Worker skills chips */}
            {job.worker.skills && job.worker.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {job.worker.skills.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-[10px]">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="p-6 text-center border-dashed">
          <p className="text-sm text-muted-foreground">Worker assignment is in progress.</p>
        </Card>
      )}

      {/* Service Details Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Service Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <span className="text-xs text-muted-foreground block mb-1">Description</span>
            <p className="text-foreground whitespace-pre-wrap text-xs bg-muted/40 p-3 rounded-lg">
              {job.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block">Service Address</span>
                <p className="font-medium text-xs text-foreground">
                  {job.location.addressLine || job.location.locality}, {job.location.city} -{" "}
                  {job.location.pincode}
                </p>
                {job.location.landmark && (
                  <p className="text-[11px] text-muted-foreground">Near {job.location.landmark}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block">Requested Timing</span>
                <p className="font-medium text-xs text-foreground capitalize">
                  {job.timing.option.toLowerCase().replace("_", " ")}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing summary */}
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Payment Amount</span>
            {job.finalPrice ? (
              <PriceDisplay amount={job.finalPrice} className="font-bold text-lg text-primary" />
            ) : job.estimatedPrice ? (
              <span className="text-sm font-semibold text-foreground">
                ₹{job.estimatedPrice.min} - ₹{job.estimatedPrice.max}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">To be confirmed</span>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          {isCompleted ? (
            <Button asChild className="w-full" size="lg">
              <Link href={`/workers/${job.worker?._id}?reviewJob=${job._id}`}>
                <Star className="mr-2 h-4 w-4 fill-primary-foreground" /> Rate & Review Professional
              </Link>
            </Button>
          ) : !isCancelled ? (
            <Button
              variant="outline"
              className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setCancelModalOpen(true)}
            >
              Cancel Booking
            </Button>
          ) : null}
        </CardFooter>
      </Card>

      {/* Cancellation Dialog */}
      <ConfirmDialog
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="Cancel Booking?"
        description="Are you sure you want to cancel this service request? If a worker is already en route, a small cancellation charge may apply."
        confirmText={cancelMutation.isPending ? "Cancelling..." : "Confirm Cancellation"}
        variant="destructive"
        onConfirm={() => cancelMutation.mutate()}
      />
    </Container>
  );
}
