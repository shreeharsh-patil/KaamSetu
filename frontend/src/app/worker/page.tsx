"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BellRing,
  CheckCircle2,
  Clock,
  ArrowRight,
  Phone,
  MessageSquare,
  IndianRupee,
  ChevronRight,
  Radio,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { DistanceDisplay } from "@/components/shared/distance-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";

type AvailabilityStatus = "AVAILABLE" | "BUSY" | "OFFLINE";

export default function WorkerDashboardPage() {
  const [availability, setAvailability] = useState<AvailabilityStatus>("AVAILABLE");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Active Job State
  const activeJob = {
    id: "job-101",
    category: "Electrician",
    title: "Tripping Main Circuit Breaker",
    customerName: "Anand Verma",
    phone: "+919820011223",
    status: "EN_ROUTE",
    address: "Flat 402, Greenfield Apts, Andheri West",
    distanceKm: 2.3,
    estimatedPrice: 450,
    startTime: "10:30 AM",
  };

  // Incoming Job Offers
  const [offers, setOffers] = useState([
    {
      id: "offer-201",
      category: "Electrician",
      title: "Ceiling Fan Regulator Sparking",
      approximateArea: "Lokhandwala Complex",
      distanceKm: 3.1,
      urgency: "IMMEDIATE",
      estimatedPrice: 350,
      expiresInSeconds: 145,
    },
    {
      id: "offer-202",
      category: "Electrician",
      title: "Geyser Power Socket Replacement",
      approximateArea: "Versova Metro",
      distanceKm: 1.8,
      urgency: "TODAY",
      estimatedPrice: 500,
      expiresInSeconds: 280,
    },
  ]);

  const handleStatusChange = async (newStatus: AvailabilityStatus) => {
    try {
      setIsChangingStatus(true);
      setAvailability(newStatus);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 400));
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDeclineOffer = (offerId: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== offerId));
  };

  return (
    <div className="py-6 space-y-6">
      <Container className="space-y-6">
        {/* Availability Toggle Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border bg-card p-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg font-bold text-white shadow-xs",
                availability === "AVAILABLE" && "bg-emerald-600",
                availability === "BUSY" && "bg-amber-500",
                availability === "OFFLINE" && "bg-slate-600"
              )}
            >
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Operating Status:</span>
                <span className="text-sm font-bold text-foreground">{availability}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {availability === "AVAILABLE" && "Receiving live job offers within your 15km radius."}
                {availability === "BUSY" && "Currently assigned to work. New leads paused."}
                {availability === "OFFLINE" && "You are clocked out. Switch to available to earn."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg self-start sm:self-auto">
            {(["AVAILABLE", "BUSY", "OFFLINE"] as AvailabilityStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                disabled={isChangingStatus}
                onClick={() => handleStatusChange(st)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-all min-h-[36px]",
                  availability === st
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Priority 1: Active Job Card */}
        {activeJob && (
          <Card className="border-primary/40 bg-primary/5 shadow-sm">
            <CardHeader className="pb-3 border-b border-primary/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                  <span className="text-xs font-bold text-primary uppercase tracking-wide">
                    Active Job In Progress
                  </span>
                </div>
                <StatusBadge status={activeJob.status} />
              </div>
              <CardTitle className="text-lg pt-1">{activeJob.title}</CardTitle>
              <CardDescription className="text-xs">
                Customer: <span className="font-semibold text-foreground">{activeJob.customerName}</span> • {activeJob.address}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-3 pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <DistanceDisplay distanceKm={activeJob.distanceKm} />
                  <span>•</span>
                  <span className="text-muted-foreground">Expected start: {activeJob.startTime}</span>
                </div>
                <PriceDisplay amount={activeJob.estimatedPrice} label="Fare" />
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-primary/10 flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2">
                <a href={`tel:${activeJob.phone}`}>
                  <Button variant="outline" size="sm" leftIcon={<Phone className="h-3.5 w-3.5 text-emerald-600" />}>
                    Call Client
                  </Button>
                </a>
                <Link href="/worker/messages">
                  <Button variant="outline" size="sm" leftIcon={<MessageSquare className="h-3.5 w-3.5" />}>
                    Message
                  </Button>
                </Link>
              </div>

              <Link href={`/worker/jobs/${activeJob.id}`}>
                <Button size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Manage Job & Verify OTP
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {/* Priority 2: New Nearby Job Offers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Nearby Job Leads</h2>
              {offers.length > 0 && (
                <Badge variant="default" className="text-[10px] py-0 px-1.5">
                  {offers.length} New
                </Badge>
              )}
            </div>
            <Link href="/worker/offers" className="text-xs font-semibold text-primary hover:underline flex items-center">
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {offers.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-sm text-muted-foreground">No new leads right now. Keep your status set to Available.</p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {offers.map((offer) => (
                <Card key={offer.id} className="flex flex-col justify-between hover:border-primary/40 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={offer.urgency === "IMMEDIATE" ? "destructive" : "secondary"} className="text-[10px]">
                        {offer.urgency === "IMMEDIATE" ? "Immediate Need" : "Today"}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Expires in {offer.expiresInSeconds}s</span>
                      </span>
                    </div>
                    <CardTitle className="text-base">{offer.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {offer.approximateArea}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="py-2">
                    <div className="flex justify-between items-center text-xs">
                      <DistanceDisplay distanceKm={offer.distanceKm} />
                      <PriceDisplay amount={offer.estimatedPrice} label="Est. Payout" />
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeclineOffer(offer.id)}
                      className="flex-1"
                    >
                      Decline
                    </Button>
                    <Link href={`/worker/offers/${offer.id}`} className="flex-1">
                      <Button size="sm" className="w-full">
                        Accept Lead
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Priority 3: Today's Earnings Snapshot */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs text-muted-foreground">Today&apos;s Net Profit</span>
              <CardTitle className="text-2xl font-extrabold text-foreground flex items-center gap-1">
                <IndianRupee className="h-5 w-5 text-primary" />
                <span>1,250</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-emerald-600 font-medium">3 completed jobs today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs text-muted-foreground">Active Hours Online</span>
              <CardTitle className="text-2xl font-extrabold text-foreground flex items-center gap-1">
                <Clock className="h-5 w-5 text-primary" />
                <span>5.2 hrs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Effective ₹240 / hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <span className="text-xs text-muted-foreground">Customer Rating</span>
              <CardTitle className="text-2xl font-extrabold text-foreground flex items-center gap-1">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>4.9 / 5.0</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">100% on-time arrival rate</p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
