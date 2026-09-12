"use client";

import { use, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ShieldCheck,
  Star,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { PriceDisplay } from "@/components/shared/price-display";
import { reviewsApi } from "@/features/reviews/api";

function WorkerProfileContent({ workerId }: { workerId: string }) {
  const searchParams = useSearchParams();
  const reviewJobId = searchParams.get("reviewJob");
  const queryClient = useQueryClient();

  const [reviewModalOpen, setReviewModalOpen] = useState(!!reviewJobId);
  const [rating, setRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [punctualityRating, setPunctualityRating] = useState(5);
  const [communicationRating, setCommunicationRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const { data: worker, isLoading, error } = useQuery({
    queryKey: ["workers", "profile", workerId],
    queryFn: () => reviewsApi.getPublicWorkerProfile(workerId),
  });

  const submitReviewMutation = useMutation({
    mutationFn: () => {
      if (!reviewJobId) throw new Error("No eligible job specified to review");
      return reviewsApi.submitReview(reviewJobId, {
        overallRating: rating,
        qualityRating,
        punctualityRating,
        communicationRating,
        comment: reviewComment,
      });
    },
    onSuccess: () => {
      setReviewSubmitted(true);
      queryClient.invalidateQueries({ queryKey: ["workers", "profile", workerId] });
      setTimeout(() => {
        setReviewModalOpen(false);
      }, 1500);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : "Failed to submit review.";
      setReviewError(msg);
    },
  });

  if (isLoading) {
    return (
      <div className="py-12 max-w-2xl space-y-4">
        <div className="h-48 rounded-2xl bg-muted/40 animate-pulse border" />
        <div className="h-64 rounded-2xl bg-muted/40 animate-pulse border" />
      </div>
    );
  }

  if (error || !worker) {
    return (
      <div className="py-12 max-w-lg text-center space-y-4 mx-auto">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <p className="text-sm text-muted-foreground">This worker profile does not exist or has been suspended.</p>
        <Button asChild>
          <Link href="/customer">Back to Home</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Back button & Title Bar */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="rounded-xl">
          <Link href="/customer">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back
          </Link>
        </Button>
        <span className="font-bold text-sm text-foreground">Worker Profile</span>
        {reviewJobId ? (
          <Button size="sm" className="rounded-xl" onClick={() => setReviewModalOpen(true)}>
            <Star className="mr-1 h-4 w-4 fill-primary-foreground" /> Rate Pro
          </Button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {/* Profile Avatar & Hero Information (Matching Figma Screen 4) */}
      <Card className="rounded-3xl p-6 text-center space-y-4 bazaar-card-shadow">
        <div className="flex flex-col items-center">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-primary/20 shrink-0 shadow-sm">
              <AvatarImage src={worker.avatarUrl} alt={worker.name} />
              <AvatarFallback className="font-extrabold text-2xl bg-primary/10 text-primary">
                {worker.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full bg-emerald-500 border-2 border-background" />
          </div>

          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <h1 className="text-xl sm:text-2xl font-extrabold text-foreground">{worker.name}</h1>
              {worker.isVerified && (
                <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-muted-foreground">{worker.category}</p>
            <p className="text-xs text-muted-foreground">📍 {worker.approximateLocality}, Mumbai</p>
          </div>
        </div>

        {/* 3 Metric Stats Cards Side by Side (Matching Screen 4) */}
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-2xl bg-secondary/80 border border-border/70 text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-extrabold text-foreground">
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
              <span>{worker.averageRating.toFixed(1)}</span>
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
              {worker.totalReviews} Reviews
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-secondary/80 border border-border/70 text-center">
            <span className="text-sm font-extrabold text-foreground block">
              {worker.completedJobsCount}+
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
              Jobs Done
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-secondary/80 border border-border/70 text-center">
            <span className="text-sm font-extrabold text-foreground block">
              {worker.experienceYears}+ Yrs
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
              Experience
            </span>
          </div>
        </div>

        {/* Bio */}
        {worker.bio && (
          <div className="text-left pt-2">
            <span className="text-xs font-bold text-foreground block mb-1">About</span>
            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/40 p-3.5 rounded-2xl">
              {worker.bio}
            </p>
          </div>
        )}

        {/* Verified Badges Row */}
        <div className="pt-2 border-t border-border/60">
          <span className="text-[11px] font-bold text-foreground block mb-2 text-left">Verified Credentials</span>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              <span>Aadhaar KYC Verified</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>Police Background Checked</span>
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
              <Star className="h-3.5 w-3.5 text-purple-600" />
              <span>Skills Certified</span>
            </span>
          </div>
        </div>
      </Card>

      {/* Floating Bottom Booking Bar (Matching Figma Screen 4) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur border-t border-border/80 p-3 shadow-lg">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] text-muted-foreground block">Estimated Rate</span>
            <PriceDisplay amount={worker.basePricing?.visitCharge || 350} rateType="hourly" className="font-extrabold text-foreground" />
          </div>
          <Button asChild size="lg" className="rounded-xl px-6 font-bold shadow-xs">
            <Link href={`/customer/jobs/new?workerId=${worker.id}`}>
              Book {worker.name.split(" ")[0]} Now
            </Link>
          </Button>
        </div>
      </div>

      {/* Skills & Languages */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Specializations & Languages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-xs text-muted-foreground block mb-2">Verified Skills:</span>
            <div className="flex flex-wrap gap-2">
              {worker.skills.map((skill, i) => (
                <Badge key={i} variant="secondary" className="px-3 py-1 text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-muted-foreground block mb-2">Languages Spoken:</span>
            <div className="flex flex-wrap gap-2">
              {worker.languages.map((lang, i) => (
                <Badge key={i} variant="outline" className="px-2.5 py-0.5 text-xs">
                  {lang}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reviews Feed */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          Customer Reviews ({worker.reviews.length})
        </h2>

        {worker.reviews.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 border rounded-xl">
            No customer reviews yet. Be the first to leave feedback!
          </p>
        ) : (
          <div className="space-y-3">
            {worker.reviews.map((rev) => (
              <Card key={rev.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-foreground">{rev.customerName}</span>
                    <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50">
                      Verified Booking
                    </Badge>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(rev.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 ${
                        s <= rev.overallRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                </div>

                {rev.comment && (
                  <p className="text-xs text-muted-foreground pt-1">{rev.comment}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Review Submission Dialog */}
      <Dialog open={reviewModalOpen} onOpenChange={setReviewModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate & Review {worker.name}</DialogTitle>
            <DialogDescription>
              Your feedback helps maintain high standards and verified trust across the platform.
            </DialogDescription>
          </DialogHeader>

          {reviewSubmitted ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-sm">Thank You for Your Feedback!</h3>
              <p className="text-xs text-muted-foreground">Your review has been published.</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              {reviewError && (
                <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> {reviewError}
                </div>
              )}

              <div className="space-y-1 text-center">
                <label className="text-xs font-semibold block text-foreground">Overall Rating</label>
                <div className="flex justify-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`h-7 w-7 ${
                          star <= rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Write a Review (Optional)</label>
                <Textarea
                  placeholder="Share details of your experience with their quality, punctuality, and work..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t text-xs">
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Quality</span>
                  <select
                    value={qualityRating}
                    onChange={(e) => setQualityRating(Number(e.target.value))}
                    className="w-full p-1.5 rounded border bg-background text-xs"
                  >
                    <option value={5}>5 - Excellent</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Average</option>
                    <option value={2}>2 - Poor</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Punctuality</span>
                  <select
                    value={punctualityRating}
                    onChange={(e) => setPunctualityRating(Number(e.target.value))}
                    className="w-full p-1.5 rounded border bg-background text-xs"
                  >
                    <option value={5}>5 - On Time</option>
                    <option value={4}>4 - Slight Delay</option>
                    <option value={3}>3 - Late</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] text-muted-foreground block">Communication</span>
                  <select
                    value={communicationRating}
                    onChange={(e) => setCommunicationRating(Number(e.target.value))}
                    className="w-full p-1.5 rounded border bg-background text-xs"
                  >
                    <option value={5}>5 - Polite & Clear</option>
                    <option value={4}>4 - Good</option>
                    <option value={3}>3 - Fair</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {!reviewSubmitted && (
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setReviewModalOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={submitReviewMutation.isPending}
                onClick={() => submitReviewMutation.mutate()}
              >
                {submitReviewMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  "Post Review"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WorkerPublicProfilePage({
  params,
}: {
  params: Promise<{ workerId: string }>;
}) {
  const { workerId } = use(params);

  return (
    <Container className="py-6">
      <Suspense fallback={<div className="h-96 rounded-2xl bg-muted/40 animate-pulse" />}>
        <WorkerProfileContent workerId={workerId} />
      </Suspense>
    </Container>
  );
}
