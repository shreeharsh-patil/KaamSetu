"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DistanceDisplay } from "@/components/shared/distance-display";
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import { jobsApi } from "@/features/jobs/api";
import { ApiError } from "@/lib/api/errors";

export default function WorkerOfferDetailPage({
  params,
}: {
  params: Promise<{ offerId: string }>;
}) {
  const { offerId } = use(params);
  const router = useRouter();

  const [alreadyAssignedError, setAlreadyAssignedError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);

  const { data: offer, isLoading, error } = useQuery({
    queryKey: ["worker", "offer", offerId],
    queryFn: () => jobsApi.getOfferById(offerId),
  });

  const acceptMutation = useMutation({
    mutationFn: () => jobsApi.acceptOffer(offerId),
    onSuccess: (data) => {
      // Direct to active job execution
      router.push(`/worker/jobs/${data.job.id}`);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.code === "JOB_ALREADY_ASSIGNED" || err.status === 409) {
          setAlreadyAssignedError(true);
          return;
        }
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Could not accept job. Please try again.");
      }
    },
  });

  const declineMutation = useMutation({
    mutationFn: () => jobsApi.declineOffer(offerId),
    onSuccess: () => {
      router.push("/worker/offers");
    },
  });

  if (isLoading) {
    return (
      <Container className="py-12 max-w-lg text-center space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading offer details...</p>
      </Container>
    );
  }

  if (error || !offer) {
    return (
      <Container className="py-12 max-w-lg text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Offer Not Found or Expired</h2>
        <p className="text-sm text-muted-foreground">
          This broadcast has expired or has been removed.
        </p>
        <Button asChild>
          <Link href="/worker/offers">Back to Nearby Offers</Link>
        </Button>
      </Container>
    );
  }

  return (
    <Container className="py-6 max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/worker/offers">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Review Job Opportunity</h1>
          <p className="text-xs text-muted-foreground">Offer ID: #{offer.id.slice(-8)}</p>
        </div>
      </div>

      {/* Concurrency Error Banner */}
      {alreadyAssignedError && (
        <Card className="border-destructive/30 bg-destructive/10 text-destructive p-4 space-y-3">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-sm">Job Already Assigned</h3>
              <p className="text-xs">
                Another nearby professional accepted this job just before you. Don&apos;t worry, new jobs will appear shortly!
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href="/worker/offers">Return to Available Offers</Link>
          </Button>
        </Card>
      )}

      {errorMessage && !alreadyAssignedError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Card>
        <CardHeader className="space-y-2">
          <div className="flex justify-between items-start">
            <Badge variant="outline" className="uppercase text-xs font-semibold">
              {offer.category}
            </Badge>
            <Badge
              variant={offer.urgency === "EMERGENCY" ? "destructive" : "secondary"}
              className="uppercase text-xs"
            >
              {offer.urgency}
            </Badge>
          </div>
          <CardTitle className="text-xl font-bold">{offer.title}</CardTitle>
          <CardDescription className="text-sm">{new Date(offer.preferredTime).toLocaleString()}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Customer Requirements
            </h4>
            <p className="text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg whitespace-pre-wrap">
              {offer.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-xs text-muted-foreground">Approximate Locality</span>
              <p className="font-semibold text-sm text-foreground">{offer.approximateLocality}</p>
              <DistanceDisplay meters={offer.distanceKm * 1000} className="text-xs text-muted-foreground block" />
            </div>

            <div className="p-3 rounded-lg border bg-card space-y-1">
              <span className="text-xs text-muted-foreground">Estimated Payout</span>
              <p className="font-bold text-base text-primary">
                {offer.estimatedAmount ? `₹${offer.estimatedAmount}` : "To be agreed"}
              </p>
              <span className="text-[11px] text-muted-foreground block">Zero commission cut</span>
            </div>
          </div>

          {/* Privacy note */}
          <div className="p-3 rounded-lg bg-muted/50 border flex items-start gap-2.5 text-xs text-muted-foreground">
            <Lock className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
            <span>
              For customer privacy, the exact apartment/street address will be unlocked after you accept this request.
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            variant="outline"
            onClick={() => setDeclineDialogOpen(true)}
            disabled={acceptMutation.isPending || alreadyAssignedError}
            className="w-full sm:w-1/3"
          >
            Decline
          </Button>
          <Button
            onClick={() => acceptMutation.mutate()}
            disabled={acceptMutation.isPending || alreadyAssignedError}
            className="w-full sm:w-2/3"
            size="lg"
          >
            {acceptMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirming Assignment...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" /> Accept Job
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Decline confirmation */}
      <ConfirmDialog
        open={declineDialogOpen}
        onOpenChange={setDeclineDialogOpen}
        title="Decline this job offer?"
        description="Are you sure you want to decline? It will be removed from your incoming offers list."
        confirmText={declineMutation.isPending ? "Declining..." : "Yes, Decline Offer"}
        variant="destructive"
        onConfirm={() => declineMutation.mutate()}
      />
    </Container>
  );
}
