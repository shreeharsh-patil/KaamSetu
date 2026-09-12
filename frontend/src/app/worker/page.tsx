"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, Briefcase, IndianRupee, Radio } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriceDisplay } from "@/components/shared/price-display";
import { jobsApi } from "@/features/jobs/api";
import { workersApi } from "@/features/workers/api";
import { earningsApi } from "@/features/earnings/api";
import type { WorkerAvailability } from "@/features/workers/types";

export default function WorkerDashboardPage() {
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["worker", "profile"], queryFn: workersApi.me });
  const assignedJobs = useQuery({ queryKey: ["worker", "jobs", "assigned"], queryFn: () => jobsApi.getJobs({ status: "ASSIGNED" }) });
  const offers = useQuery({ queryKey: ["worker", "offers"], queryFn: jobsApi.getWorkerOffers, refetchInterval: 10000 });
  const earnings = useQuery({ queryKey: ["worker", "earnings", "today"], queryFn: () => earningsApi.getEarningsSummary("TODAY") });
  const availability = useMutation({
    mutationFn: workersApi.updateAvailability,
    onSuccess: (updated) => queryClient.setQueryData(["worker", "profile"], updated),
  });

  if (profile.isLoading || assignedJobs.isLoading || offers.isLoading || earnings.isLoading) {
    return <Container className="py-8 space-y-4"><div className="h-24 animate-pulse rounded-2xl bg-muted" /><div className="h-48 animate-pulse rounded-2xl bg-muted" /></Container>;
  }
  const error = profile.error || assignedJobs.error || offers.error || earnings.error;
  if (error) return <Container className="py-8"><Alert variant="destructive"><AlertDescription>{error instanceof Error ? error.message : "Could not load the worker dashboard"}</AlertDescription></Alert></Container>;
  if (!profile.data?.onboardingComplete) return <Container className="py-8"><Card className="p-6 text-center space-y-3"><p>Your worker profile is incomplete and cannot receive matches.</p><Button asChild><Link href="/worker/onboarding">Complete onboarding</Link></Button></Card></Container>;

  const activeJob = assignedJobs.data?.find((job) => !["COMPLETED", "CANCELLED", "EXPIRED"].includes(job.status));
  return (
    <Container className="py-6 space-y-6">
      <Card><CardContent className="p-4 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="flex items-center gap-3"><Radio className="h-5 w-5 text-primary" /><div><p className="font-bold">Availability: {profile.data.availabilityStatus}</p><p className="text-xs text-muted-foreground">Matching uses your confirmed location and {profile.data.serviceRadiusKm} km radius.</p></div></div>
        <div className="flex gap-2">{(["AVAILABLE", "BUSY", "OFFLINE"] as WorkerAvailability[]).map((status) => <Button key={status} size="sm" variant={profile.data.availabilityStatus === status ? "default" : "outline"} disabled={availability.isPending} onClick={() => availability.mutate(status)}>{status}</Button>)}</div>
      </CardContent></Card>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card><CardHeader><CardTitle className="text-sm flex gap-2"><IndianRupee className="h-4 w-4" />Today&apos;s net earnings</CardTitle></CardHeader><CardContent><PriceDisplay amount={earnings.data?.netEarnings ?? 0} className="text-2xl font-bold" /></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm flex gap-2"><Briefcase className="h-4 w-4" />Jobs completed</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{earnings.data?.jobsCompleted ?? 0}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm flex gap-2"><BellRing className="h-4 w-4" />Pending offers</CardTitle></CardHeader><CardContent className="text-2xl font-bold">{offers.data?.filter((offer) => offer.status === "PENDING").length ?? 0}</CardContent></Card>
      </div>

      <section className="space-y-3"><div className="flex justify-between"><h2 className="font-bold">Current active job</h2><Link className="text-sm text-primary" href="/worker/jobs">All jobs</Link></div>
        {activeJob ? <Card><CardContent className="p-5 flex justify-between gap-4"><div><Badge>{activeJob.status}</Badge><h3 className="mt-2 font-bold">{activeJob.title}</h3><p className="text-xs text-muted-foreground">{activeJob.location.city}</p></div><Button asChild><Link href={`/worker/jobs/${activeJob.id}`}>Manage job</Link></Button></CardContent></Card> : <Card className="p-6 text-sm text-muted-foreground">No active assignment.</Card>}
      </section>

      <section className="space-y-3"><div className="flex justify-between"><h2 className="font-bold">Current offers</h2><Link className="text-sm text-primary" href="/worker/offers">View all</Link></div>
        {(offers.data?.filter((offer) => offer.status === "PENDING").slice(0, 3) ?? []).map((offer) => <Card key={offer.id}><CardContent className="p-5 flex justify-between gap-4"><div><Badge variant={offer.urgency === "EMERGENCY" ? "destructive" : "secondary"}>{offer.urgency}</Badge><h3 className="mt-2 font-bold">{offer.title}</h3><p className="text-xs text-muted-foreground">{offer.approximateLocality} · {offer.distanceKm.toFixed(1)} km</p></div><Button asChild><Link href={`/worker/offers/${offer.id}`}>Review</Link></Button></CardContent></Card>)}
        {offers.data?.filter((offer) => offer.status === "PENDING").length === 0 ? <Card className="p-6 text-sm text-muted-foreground">No pending offers.</Card> : null}
      </section>
    </Container>
  );
}
