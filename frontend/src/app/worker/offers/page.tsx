"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  BellRing,
  Clock,
  ArrowRight,
  Briefcase,
  Flame,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DistanceDisplay } from "@/components/shared/distance-display";
import { jobsApi } from "@/features/jobs/api";

export default function WorkerOffersPage() {
  const { data: offers, isLoading, error } = useQuery({
    queryKey: ["worker", "offers"],
    queryFn: () => jobsApi.getWorkerOffers(),
    refetchInterval: 5000, // Poll every 5s for new nearby jobs
  });

  const pendingOffers = offers?.filter((o) => o.status === "PENDING") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BellRing className="h-6 w-6 text-primary" />
            Job Opportunities Nearby
          </h1>
          <p className="text-sm text-muted-foreground">
            Fresh job requests matching your category and service radius
          </p>
        </div>
        {pendingOffers.length > 0 && (
          <Badge className="bg-primary text-primary-foreground font-semibold">
            {pendingOffers.length} Active {pendingOffers.length === 1 ? "Offer" : "Offers"}
          </Badge>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive">
          Failed to load job offers. Please check your network connection.
        </div>
      ) : pendingOffers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed text-muted-foreground space-y-4">
          <Briefcase className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-lg">No pending job offers right now</h3>
            <p className="text-xs max-w-sm mx-auto">
              Make sure your availability status is set to &ldquo;AVAILABLE&rdquo; in your dashboard to receive broadcasts.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/worker">Go to Dashboard</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {pendingOffers.map((offer) => (
            <Card key={offer.id} className="border-border hover:border-primary/40 transition-all flex flex-col justify-between">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[11px] uppercase font-semibold">
                    {offer.category}
                  </Badge>
                  {offer.urgency === "EMERGENCY" ? (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <Flame className="h-3 w-3" /> Emergency
                    </Badge>
                  ) : offer.urgency === "TODAY" ? (
                    <Badge className="bg-amber-500 hover:bg-amber-600 text-white flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Urgent
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Standard</Badge>
                  )}
                </div>
                <CardTitle className="text-lg font-bold mt-2 line-clamp-1">{offer.title}</CardTitle>
                <CardDescription className="line-clamp-2 text-xs">
                  {offer.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pb-3">
                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-3 rounded-lg">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Locality:</span>
                    <span className="font-medium text-foreground">{offer.approximateLocality}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Distance:</span>
                    <DistanceDisplay meters={offer.distanceKm * 1000} className="font-medium text-foreground" />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Estimated Payout:</span>
                  <span className="font-bold text-base text-primary">
                    {offer.estimatedAmount ? `₹${offer.estimatedAmount}` : "To be agreed"}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-0">
                <Button asChild className="w-full">
                  <Link href={`/worker/offers/${offer.id}`}>
                    Review & Accept Offer <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
