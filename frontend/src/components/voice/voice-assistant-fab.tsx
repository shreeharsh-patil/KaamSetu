"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  X,
  Sparkles,
  ArrowRight,
  Volume2,
  CheckCircle2,
  MessageSquare,
  Briefcase,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { useAuth } from "@/features/auth/auth-context";

interface RecognizedIntent {
  query: string;
  role: "customer" | "worker";
  category?: string;
  actionText: string;
  targetUrl: string;
  replyMessage: string;
  statusChange?: "AVAILABLE" | "OFFLINE";
}

export function VoiceAssistantFAB() {
  const router = useRouter();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState<"customer" | "worker">("customer");
  const [lastIntent, setLastIntent] = useState<RecognizedIntent | null>(null);
  const [activeTab, setActiveTab] = useState<"record" | "shortcuts">("record");
  const [workerStatusFeedback, setWorkerStatusFeedback] = useState<string | null>(null);

  // Sync active role with logged-in user role if available
  useEffect(() => {
    if (user?.role === "worker") {
      setActiveRole("worker");
    } else if (user?.role === "customer") {
      setActiveRole("customer");
    }
  }, [user]);

  const customerShortcuts = [
    {
      label: "Book a Plumber (नल ठीक करवाना)",
      query: "Mujhe plumber chahiye bathroom pipe leak ho gaya hai paani beh raha hai",
      category: "plumbing",
      url: "/customer/jobs/new?category=plumbing",
    },
    {
      label: "Call Electrician (बिजली का काम)",
      query: "Ghar me light chali gayi switchboard me short circuit lagta hai",
      category: "electrical",
      url: "/customer/jobs/new?category=electrical",
    },
    {
      label: "Carpenter Needed (बढ़ई / दरवाजा)",
      query: "Main door lock aur hinges atak gaye hain carpenter chahiye",
      category: "carpentry",
      url: "/customer/jobs/new?category=carpentry",
    },
    {
      label: "Check My Bookings (मेरे काम)",
      query: "Mera booking status check karo technician kitni der me aayega",
      category: "status",
      url: "/customer/jobs",
    },
  ];

  const workerShortcuts = [
    {
      label: "Browse Nearby Job Leads (काम खोजें)",
      query: "Bandra aur Andheri me electrician aur wiring ke naye kaam dikhao",
      category: "leads",
      url: "/worker",
    },
    {
      label: "View Pending Job Offers (नए ऑफर)",
      query: "Mujhe naye dispatch offers dikhao jo accept karne bache hain",
      category: "offers",
      url: "/worker/offers",
    },
    {
      label: "Check Today's Earnings (आज की कमाई)",
      query: "Meri aaj ki total kamai aur ledger payout kitna hua hai",
      category: "earnings",
      url: "/worker/earnings",
    },
    {
      label: "Set Status to Available (ऑनलाइन मोड)",
      query: "Mujhe online available mark karo naye kaam ke alerts ke liye",
      category: "status_available",
      url: "/worker",
    },
    {
      label: "Take a Break / Offline (ऑफलाइन मोड)",
      query: "Mera kaam poora ho gaya abhi mujhe offline mark karo",
      category: "status_offline",
      url: "/worker",
    },
    {
      label: "Update Trade Profile (प्रोफाइल और स्किल्स)",
      query: "Mera work experience aur specialized tools profile me update karo",
      category: "profile",
      url: "/worker/profile",
    },
  ];

  const handleVoiceExtracted = (text: string) => {
    const lower = text.toLowerCase();
    setWorkerStatusFeedback(null);

    if (activeRole === "worker") {
      // Worker Voice Intent Parsing
      if (lower.includes("earn") || lower.includes("kamai") || lower.includes("paisa") || lower.includes("ledger") || lower.includes("payout")) {
        setLastIntent({
          query: text,
          role: "worker",
          actionText: "View Earnings & Ledger (कमाई देखें)",
          targetUrl: "/worker/earnings",
          replyMessage: "Opening your daily earnings overview and pending escrow payouts.",
        });
      } else if (lower.includes("offer") || lower.includes("dispatch") || lower.includes("request")) {
        setLastIntent({
          query: text,
          role: "worker",
          actionText: "Review Incoming Offers (ऑफर देखें)",
          targetUrl: "/worker/offers",
          replyMessage: "Found active job offers nearby ready for your review.",
        });
      } else if (lower.includes("online") || lower.includes("available") || lower.includes("chalu")) {
        setWorkerStatusFeedback("Availability updated to ONLINE. You are now receiving job leads!");
        setLastIntent({
          query: text,
          role: "worker",
          actionText: "Go to Live Job Radar",
          targetUrl: "/worker",
          replyMessage: "You have been marked AVAILABLE. New dispatch sirens are activated.",
          statusChange: "AVAILABLE",
        });
      } else if (lower.includes("offline") || lower.includes("band") || lower.includes("break") || lower.includes("chutti")) {
        setWorkerStatusFeedback("Availability set to OFFLINE. New leads paused.");
        setLastIntent({
          query: text,
          role: "worker",
          actionText: "Go to Worker Home",
          targetUrl: "/worker",
          replyMessage: "Status updated to OFFLINE. Rest well, leads are temporarily paused.",
          statusChange: "OFFLINE",
        });
      } else if (lower.includes("profile") || lower.includes("skill") || lower.includes("experience") || lower.includes("certificate")) {
        setLastIntent({
          query: text,
          role: "worker",
          actionText: "Open Worker Profile",
          targetUrl: "/worker/profile",
          replyMessage: "Opening your verified trade credentials, tools, and rate card.",
        });
      } else {
        // Default worker search
        setLastIntent({
          query: text,
          role: "worker",
          actionText: "Search Job Leads (काम खोजें)",
          targetUrl: `/worker?search=${encodeURIComponent(text)}`,
          replyMessage: "Searching local matching jobs matching your spoken query.",
        });
      }
      return;
    }

    // Customer Voice Intent Parsing
    let category = "plumbing";
    let targetUrl = "/customer/jobs/new?category=plumbing";
    let reply = "Requirement analyzed! Proceed to post your service request.";

    if (lower.includes("electric") || lower.includes("light") || lower.includes("bijli") || lower.includes("wiring") || lower.includes("switch")) {
      category = "electrical";
      targetUrl = "/customer/jobs/new?category=electrical";
      reply = "Electrical issue detected! Connecting you to top-rated electricians nearby.";
    } else if (lower.includes("carpenter") || lower.includes("furniture") || lower.includes("darwaza") || lower.includes("wood") || lower.includes("lock")) {
      category = "carpentry";
      targetUrl = "/customer/jobs/new?category=carpentry";
      reply = "Carpentry requirement detected! Finding certified carpenters nearby.";
    } else if (lower.includes("paint") || lower.includes("rang") || lower.includes("putty")) {
      category = "painting";
      targetUrl = "/customer/jobs/new?category=painting";
      reply = "Painting requirement detected! Connecting you to verified painters.";
    } else if (lower.includes("ac") || lower.includes("fridge") || lower.includes("washing") || lower.includes("appliance")) {
      category = "appliance";
      targetUrl = "/customer/jobs/new?category=appliance";
      reply = "Appliance repair request detected! Connecting to appliance technicians.";
    } else if (lower.includes("status") || lower.includes("booking") || lower.includes("kaam") || lower.includes("kaha tak")) {
      targetUrl = "/customer/jobs";
      reply = "Taking you to your active service bookings and technician live tracking.";
    }

    // Save extracted text to draft for job wizard to pick up
    try {
      sessionStorage.setItem(
        "kaamsetu_job_draft_v1",
        JSON.stringify({
          category,
          title: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
          description: text,
          urgency: lower.includes("urgent") || lower.includes("jaldi") || lower.includes("emergency") ? "URGENT" : "STANDARD",
        })
      );
    } catch {
      // ignore
    }

    setLastIntent({
      query: text,
      role: "customer",
      category,
      actionText: `Book ${category.toUpperCase()} Professional`,
      targetUrl,
      replyMessage: reply,
    });
  };

  const handleApplyShortcut = (query: string) => {
    handleVoiceExtracted(query);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/95 backdrop-blur-md border border-primary/30 shadow-lg text-xs font-semibold text-foreground animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span>
              {user?.role === "worker"
                ? "🎙️ Worker Voice AI (बोलकर काम ढूँढें)"
                : "🎙️ Voice AI: Customer & Worker"}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close Voice Assistant" : "Open Voice AI Assistant"}
          className={`group relative flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-2xl transition-all duration-300 ${
            isOpen
              ? "bg-muted text-foreground border border-border rotate-90"
              : "bg-gradient-to-tr from-primary to-orange-500 text-white hover:scale-105 shadow-primary/30"
          }`}
        >
          {isOpen ? (
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <>
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping -z-10 group-hover:scale-110 duration-1000" />
              <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
            </>
          )}
        </button>
      </div>

      {/* Modal / Assistant Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-foreground">
                      KaamSetu Voice AI
                    </h3>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      {activeRole === "worker" ? "Worker Pro (कारीगर)" : "Customer Mode"}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {activeRole === "worker"
                      ? "Search jobs, manage availability & check earnings hands-free"
                      : "Speak your problem naturally in any Indian language"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Role Switcher Pill inside Voice AI */}
            <div className="px-4 pt-3 pb-1 flex items-center justify-between border-b bg-muted/20">
              <span className="text-[11px] font-medium text-muted-foreground">I am using Voice AI as:</span>
              <div className="flex rounded-lg bg-muted p-0.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRole("customer");
                    setLastIntent(null);
                    setWorkerStatusFeedback(null);
                  }}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    activeRole === "customer"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="h-3 w-3" /> Customer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRole("worker");
                    setLastIntent(null);
                    setWorkerStatusFeedback(null);
                  }}
                  className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                    activeRole === "worker"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Briefcase className="h-3 w-3" /> Worker (कारीगर)
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Language Indicator */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Volume2 className="h-3.5 w-3.5 text-primary" /> Multi-Dialect AI:
                </span>
                <span>हिंदी • मराठी • Hinglish • English</span>
              </div>

              {/* Status Feedback banner for worker */}
              {workerStatusFeedback && (
                <div className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span>{workerStatusFeedback}</span>
                </div>
              )}

              {/* Tabs */}
              <div className="grid grid-cols-2 p-1 bg-muted rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("record")}
                  className={`py-1.5 rounded-lg transition-all ${
                    activeTab === "record" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {activeRole === "worker" ? "Speak Command (कारीगर आवाज़)" : "Speak Requirement (समस्या बोलें)"}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("shortcuts")}
                  className={`py-1.5 rounded-lg transition-all ${
                    activeTab === "shortcuts" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Quick Scenarios ({activeRole === "worker" ? "Worker" : "Customer"})
                </button>
              </div>

              {activeTab === "record" ? (
                <div className="space-y-4">
                  <VoiceRecorder
                    onConfirmText={handleVoiceExtracted}
                    title={activeRole === "worker" ? "Worker Voice Commander" : "Speak Your Need"}
                    description={
                      activeRole === "worker"
                        ? "Say commands like: 'Aaj ki kamai batao', 'Andheri me electrician kaam dikhao', or 'Mujhe online karo'."
                        : "Tell us what you need repaired. AI will auto-categorize and route it to verified professionals."
                    }
                    placeholderPrompt={
                      activeRole === "worker"
                        ? "उदा.: 'Bandra me geyser socket ke urgent kaam dikhao'"
                        : "उदा.: 'Mera kitchen sink leak ho raha hai aur paani beh raha hai'"
                    }
                  />

                  {lastIntent && (
                    <Card className="border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-bottom-2">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <div className="space-y-1 text-xs">
                            <span className="font-bold text-foreground">AI Understanding:</span>
                            <p className="text-muted-foreground">{lastIntent.replyMessage}</p>
                            <p className="italic text-[11px] bg-background/80 p-2 rounded-lg border">
                              &ldquo;{lastIntent.query}&rdquo;
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <Button
                            size="sm"
                            onClick={() => {
                              setIsOpen(false);
                              router.push(lastIntent.targetUrl);
                            }}
                            className="text-xs font-bold gap-1 rounded-xl"
                          >
                            {lastIntent.actionText} <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-2">
                    {activeRole === "worker"
                      ? "Select an example to test Worker Voice Assistant:"
                      : "Select a common customer example to test Voice AI:"}
                  </p>
                  {(activeRole === "worker" ? workerShortcuts : customerShortcuts).map((sc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyShortcut(sc.query)}
                      className="w-full text-left p-3 rounded-2xl border border-border bg-card hover:bg-muted/40 transition-all flex items-center justify-between group"
                    >
                      <div className="space-y-1">
                        <div className="font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                          {sc.label}
                        </div>
                        <div className="text-[11px] text-muted-foreground italic">
                          &ldquo;{sc.query}&rdquo;
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-muted/40 border-t flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3.5 w-3.5" /> Zero typing required for workers & customers
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/voice-ai");
                }}
                className="text-primary hover:underline font-medium"
              >
                Voice AI Details →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
