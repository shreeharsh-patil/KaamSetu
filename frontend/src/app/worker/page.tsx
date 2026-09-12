"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BellRing,
  Clock,
  ArrowRight,
  Phone,
  MessageSquare,
  IndianRupee,
  ChevronRight,
  Radio,
  Mic,
  Volume2,
  VolumeX,
  Sparkles,
  Filter,
  CheckCircle2,
  X,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PriceDisplay } from "@/components/shared/price-display";
import { DistanceDisplay } from "@/components/shared/distance-display";
import { StatusBadge } from "@/components/shared/status-badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/i18n-context";
import { VoiceRecorder } from "@/components/voice/voice-recorder";

type AvailabilityStatus = "AVAILABLE" | "BUSY" | "OFFLINE";

export default function WorkerDashboardPage() {
  const { t } = useTranslation();
  const [availability, setAvailability] = useState<AvailabilityStatus>("AVAILABLE");
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  // Voice AI Search & Command state
  const [voiceSearchQuery, setVoiceSearchQuery] = useState<string>("");
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);

  // Customer Audio Note state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

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
    audioNoteText: "Bhaiya, AC chalate hi main switchboard me sparking aa rahi hai aur MCB trip ho raha hai, please jaldi aao.",
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
    {
      id: "offer-203",
      category: "Plumbing",
      title: "Main Kitchen Pipe Leakage",
      approximateArea: "Four Bungalows, Andheri",
      distanceKm: 2.5,
      urgency: "IMMEDIATE",
      estimatedPrice: 400,
      expiresInSeconds: 320,
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

  const handleVoiceCommandExtracted = (text: string) => {
    const lower = text.toLowerCase();
    setIsVoiceModalOpen(false);

    if (lower.includes("online") || lower.includes("available") || lower.includes("chalu")) {
      handleStatusChange("AVAILABLE");
      setVoiceFeedback("Voice Command: Status changed to AVAILABLE (ऑनलाइन)");
      return;
    }

    if (lower.includes("offline") || lower.includes("band") || lower.includes("break")) {
      handleStatusChange("OFFLINE");
      setVoiceFeedback("Voice Command: Status changed to OFFLINE (ऑफलाइन)");
      return;
    }

    if (lower.includes("kamai") || lower.includes("earn") || lower.includes("paisa")) {
      setVoiceFeedback("Voice Command: Navigating to earnings...");
      window.location.href = "/worker/earnings";
      return;
    }

    // Otherwise apply as job filter query
    setVoiceSearchQuery(text);
    setVoiceFeedback(`Voice Filter applied: "${text}"`);
  };

  // Play synthetic speech for customer voice note
  const togglePlayCustomerAudio = () => {
    if (isPlayingAudio) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingAudio(false);
      return;
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeJob.audioNoteText);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      setIsPlayingAudio(true);
      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(true);
      setTimeout(() => setIsPlayingAudio(false), 4000);
    }
  };

  // Filtered offers by voice filter
  const filteredOffers = offers.filter((o) => {
    if (!voiceSearchQuery) return true;
    const query = voiceSearchQuery.toLowerCase();
    if (query.includes("urgent") || query.includes("immediate") || query.includes("jaldi")) {
      return o.urgency === "IMMEDIATE";
    }
    if (query.includes("high") || query.includes("400") || query.includes("500") || query.includes("zyada")) {
      return o.estimatedPrice >= 400;
    }
    return (
      o.title.toLowerCase().includes(query) ||
      o.approximateArea.toLowerCase().includes(query) ||
      o.category.toLowerCase().includes(query)
    );
  });

  return (
    <div className="py-6 space-y-6">
      <Container className="space-y-6">
        {/* Availability Segmented Switch Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-border/80 bg-card p-4 bazaar-card-shadow">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl font-bold text-white shadow-xs",
                availability === "AVAILABLE" && "bg-emerald-600",
                availability === "BUSY" && "bg-amber-500",
                availability === "OFFLINE" && "bg-slate-600"
              )}
            >
              <Radio className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Status:</span>
                <span className="text-sm font-bold text-foreground capitalize">
                  {availability === "AVAILABLE" && t("worker.available", "Available")}
                  {availability === "BUSY" && t("worker.busy", "Busy")}
                  {availability === "OFFLINE" && t("worker.offline", "Offline")}
                </span>
                {availability === "AVAILABLE" && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {availability === "AVAILABLE" && "Receiving live job broadcasts within your 15km radius."}
                {availability === "BUSY" && "Currently assigned to work. New broadcasts paused."}
                {availability === "OFFLINE" && "You are clocked out. Switch to available to earn."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-secondary p-1 rounded-full self-start sm:self-auto border border-border/60">
            {(["AVAILABLE", "BUSY", "OFFLINE"] as AvailabilityStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                disabled={isChangingStatus}
                onClick={() => handleStatusChange(st)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-bold transition-all min-h-[34px]",
                  availability === st
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {st === "AVAILABLE" ? t("worker.available", "Available") : st === "BUSY" ? t("worker.busy", "Busy") : t("worker.offline", "Offline")}
              </button>
            ))}
          </div>
        </div>

        {/* Worker Voice AI Command & Filter Center */}
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-background p-4 bazaar-card-shadow space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xs">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-foreground">
                    Worker Voice AI Commander (कारीगर वॉइस असिस्टेंट)
                  </h3>
                  <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                    Hindi • Marathi • Hinglish
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Speak hands-free to filter nearby jobs, update availability, or check payouts.
                </p>
              </div>
            </div>

            <Button
              size="sm"
              onClick={() => setIsVoiceModalOpen(true)}
              className="rounded-xl font-bold gap-2 self-start sm:self-auto bg-primary text-white shadow-xs"
            >
              <Mic className="h-4 w-4" /> बोलकर खोजें (Voice Search)
            </Button>
          </div>

          {/* Quick Filter Voice Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
              <Filter className="h-3 w-3" /> Quick filters:
            </span>
            <button
              type="button"
              onClick={() => {
                setVoiceSearchQuery("");
                setVoiceFeedback(null);
              }}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                !voiceSearchQuery
                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                  : "bg-background hover:bg-muted text-muted-foreground"
              )}
            >
              All Leads (सब काम)
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommandExtracted("urgent")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                voiceSearchQuery.includes("urgent")
                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                  : "bg-background hover:bg-muted text-muted-foreground"
              )}
            >
              ⚡ Urgent Leads Only (तुरंत वाले)
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommandExtracted("high payout")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                voiceSearchQuery.includes("high")
                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                  : "bg-background hover:bg-muted text-muted-foreground"
              )}
            >
              💰 High Payout (&gt; ₹400)
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommandExtracted("Versova")}
              className={cn(
                "text-xs px-2.5 py-1 rounded-full border transition-all",
                voiceSearchQuery.includes("Versova")
                  ? "bg-primary text-primary-foreground border-primary font-semibold"
                  : "bg-background hover:bg-muted text-muted-foreground"
              )}
            >
              📍 Versova / Andheri
            </button>
          </div>

          {voiceFeedback && (
            <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-foreground">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> {voiceFeedback}
              </span>
              <button
                type="button"
                onClick={() => {
                  setVoiceSearchQuery("");
                  setVoiceFeedback(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* KaamBazaar Royal Navy Earnings Hero Card */}
        <div className="rounded-3xl hero-navy-card p-6 sm:p-8 shadow-lg border border-primary/20 text-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                {t("worker.netEarnings", "Today's Net Earnings")}
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white flex items-center">
                  <IndianRupee className="h-7 w-7 sm:h-8 sm:w-8" />
                  <span>1,250</span>
                </span>
                <span className="text-xs text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  + ₹450 from yesterday
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-xl text-xs font-semibold">
                <Link href="/worker/earnings">View Ledger</Link>
              </Button>
              <Button asChild className="bg-white text-[#162044] hover:bg-white/90 rounded-xl text-xs font-bold shadow-xs">
                <Link href="/worker/earnings">Withdraw</Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/15 text-xs">
            <div>
              <span className="text-white/60 block text-[11px]">Jobs Done Today</span>
              <span className="font-bold text-white text-sm">3 Completed</span>
            </div>
            <div>
              <span className="text-white/60 block text-[11px]">Active Hours</span>
              <span className="font-bold text-white text-sm">5.2 hrs</span>
            </div>
            <div>
              <span className="text-white/60 block text-[11px]">Customer Rating</span>
              <span className="font-bold text-white text-sm flex items-center gap-1">
                ⭐ 4.9 <span className="text-white/60 font-normal">(184)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Priority 1: Active Job Card */}
        {activeJob && (
          <Card className="border-primary/40 bg-primary/5 shadow-xs rounded-2xl overflow-hidden">
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
              <CardTitle className="text-lg pt-1 font-bold">{activeJob.title}</CardTitle>
              <CardDescription className="text-xs">
                Customer: <span className="font-bold text-foreground">{activeJob.customerName}</span> • {activeJob.address}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-3 pb-3 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <DistanceDisplay distanceKm={activeJob.distanceKm} />
                  <span>•</span>
                  <span className="text-muted-foreground">Expected start: {activeJob.startTime}</span>
                </div>
                <PriceDisplay amount={activeJob.estimatedPrice} label="Fare" className="font-bold" />
              </div>

              {/* Customer Voice Recording / Audio Note Player */}
              <div className="rounded-xl bg-card border border-primary/20 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <Button
                    type="button"
                    size="sm"
                    variant={isPlayingAudio ? "destructive" : "secondary"}
                    onClick={togglePlayCustomerAudio}
                    className="h-8 w-8 rounded-full p-0 shrink-0"
                    aria-label={isPlayingAudio ? "Pause Audio Note" : "Play Customer Audio Note"}
                  >
                    {isPlayingAudio ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-primary" />
                    )}
                  </Button>
                  <div className="text-xs">
                    <div className="font-semibold text-foreground flex items-center gap-1.5">
                      <span>Customer Voice Note (ग्राहक की आवाज़)</span>
                      {isPlayingAudio && (
                        <span className="text-[10px] text-primary animate-pulse font-mono font-bold">
                          [Playing Audio...]
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground italic text-[11px] line-clamp-1">
                      &ldquo;{activeJob.audioNoteText}&rdquo;
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={togglePlayCustomerAudio}
                  className="text-xs text-primary hover:text-primary font-bold self-start sm:self-auto"
                >
                  {isPlayingAudio ? "Stop Audio" : "Listen to Note"}
                </Button>
              </div>
            </CardContent>

            <CardFooter className="pt-2 border-t border-primary/10 flex flex-wrap gap-2 justify-between">
              <div className="flex gap-2">
                <a href={`tel:${activeJob.phone}`}>
                  <Button variant="outline" size="sm" className="rounded-xl" leftIcon={<Phone className="h-3.5 w-3.5 text-emerald-600" />}>
                    Call Client
                  </Button>
                </a>
                <Link href="/worker/messages">
                  <Button variant="outline" size="sm" className="rounded-xl" leftIcon={<MessageSquare className="h-3.5 w-3.5" />}>
                    Message
                  </Button>
                </Link>
              </div>

              <Link href={`/worker/jobs/${activeJob.id}`}>
                <Button size="sm" className="rounded-xl font-bold" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Manage Job & Verify OTP
                </Button>
              </Link>
            </CardFooter>
          </Card>
        )}

        {/* Priority 2: New Nearby Job Leads */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="h-4 w-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Available Jobs Nearby</h2>
              {filteredOffers.length > 0 && (
                <Badge variant="default" className="text-[10px] py-0 px-2 font-bold rounded-full">
                  {filteredOffers.length} {voiceSearchQuery ? "Matching" : "New"} Leads
                </Badge>
              )}
            </div>
            <Link href="/worker/offers" className="text-xs font-semibold text-primary hover:underline flex items-center">
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {filteredOffers.length === 0 ? (
            <Card className="p-8 text-center border-dashed rounded-2xl space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {voiceSearchQuery
                  ? `No leads matched voice filter "${voiceSearchQuery}"`
                  : "No new leads right now. Keep your status set to Available."}
              </p>
              {voiceSearchQuery && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setVoiceSearchQuery("");
                    setVoiceFeedback(null);
                  }}
                  className="rounded-xl text-xs"
                >
                  Clear Voice Filter
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredOffers.map((offer) => (
                <Card key={offer.id} className="flex flex-col justify-between hover:border-primary/50 transition-all rounded-2xl bazaar-card-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={offer.urgency === "IMMEDIATE" ? "destructive" : "secondary"} className="text-[10px] rounded-full">
                        {offer.urgency === "IMMEDIATE" ? "Urgent Request" : "Today"}
                      </Badge>
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Expires in {offer.expiresInSeconds}s</span>
                      </span>
                    </div>
                    <CardTitle className="text-base font-bold">{offer.title}</CardTitle>
                    <CardDescription className="text-xs line-clamp-2">
                      {offer.approximateArea}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="py-2">
                    <div className="flex justify-between items-center text-xs">
                      <DistanceDisplay distanceKm={offer.distanceKm} />
                      <PriceDisplay amount={offer.estimatedPrice} label="Est. Payout" className="font-bold text-sm" />
                    </div>
                  </CardContent>

                  <CardFooter className="pt-3 border-t border-border/60 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeclineOffer(offer.id)}
                      className="flex-1 rounded-xl"
                    >
                      Decline
                    </Button>
                    <Link href={`/worker/offers/${offer.id}`} className="flex-1">
                      <Button size="sm" className="w-full rounded-xl font-bold">
                        Accept Lead
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* Inline Worker Voice AI Modal */}
      {isVoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <Mic className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-sm text-foreground">Worker Voice AI Commander</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsVoiceModalOpen(false)}
                className="h-7 w-7 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <VoiceRecorder
              onConfirmText={handleVoiceCommandExtracted}
              title="Speak Worker Command"
              description="Speak in Hindi, Marathi, or English. You can filter jobs, toggle online/offline status, or ask for your earnings."
              placeholderPrompt="Jaise: 'Andheri me electrician kaam dikhao' ya 'Mujhe online karo'"
            />
          </div>
        </div>
      )}
    </div>
  );
}
