"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Mic,
  X,
  Sparkles,
  ArrowRight,
  Volume2,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/voice/voice-recorder";

interface RecognizedIntent {
  query: string;
  category?: string;
  actionText: string;
  targetUrl: string;
  replyMessage: string;
}

export function VoiceAssistantFAB() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [lastIntent, setLastIntent] = useState<RecognizedIntent | null>(null);
  const [activeTab, setActiveTab] = useState<"record" | "shortcuts">("record");

  const quickShortcuts = [
    {
      label: "Book a Plumber (नल ठीक करवाना)",
      query: "Mujhe plumber chahiye bathroom pipe leak ho gaya hai",
      category: "plumbing",
      url: "/customer/jobs/new?category=plumbing",
    },
    {
      label: "Call Electrician (बिजली का काम)",
      query: "Ghar me light chali gayi short circuit lagta hai",
      category: "electrical",
      url: "/customer/jobs/new?category=electrical",
    },
    {
      label: "Check My Bookings (मेरे काम)",
      query: "Mera booking status check karo",
      url: "/customer/jobs",
    },
    {
      label: "Worker Job Feed (कारीगर काम ढूँढें)",
      query: "Mujhe aas-paas ke kaam dekhne hain",
      url: "/worker",
    },
  ];

  const handleVoiceExtracted = (text: string) => {
    const lower = text.toLowerCase();
    let category = "plumbing";
    let targetUrl = "/customer/jobs/new?category=plumbing";
    let reply = "I understood your requirement. Would you like to post this as a service request?";

    if (lower.includes("electric") || lower.includes("light") || lower.includes("bijli") || lower.includes("wiring")) {
      category = "electrical";
      targetUrl = "/customer/jobs/new?category=electrical";
      reply = "Found electrical requirement! We have verified electricians nearby in Mumbai.";
    } else if (lower.includes("carpenter") || lower.includes("furniture") || lower.includes("darwaza") || lower.includes("wood")) {
      category = "carpentry";
      targetUrl = "/customer/jobs/new?category=carpentry";
      reply = "Found carpentry requirement! We can connect you to expert carpenters.";
    } else if (lower.includes("paint") || lower.includes("rang")) {
      category = "painting";
      targetUrl = "/customer/jobs/new?category=painting";
      reply = "Painting requirement recognized. Connecting you to local painters.";
    } else if (lower.includes("status") || lower.includes("booking") || lower.includes("kaam")) {
      targetUrl = "/customer/jobs";
      reply = "Taking you to your active bookings and applications.";
    }

    // Save extracted text to draft for job wizard to pick up
    try {
      sessionStorage.setItem(
        "kaamsetu_job_draft_v1",
        JSON.stringify({
          category,
          title: text.slice(0, 50) + (text.length > 50 ? "..." : ""),
          description: text,
          urgency: lower.includes("urgent") || lower.includes("jaldi") ? "URGENT" : "STANDARD",
        })
      );
    } catch {
      // ignore
    }

    setLastIntent({
      query: text,
      category,
      actionText: `Proceed to ${category.toUpperCase()} Request`,
      targetUrl,
      replyMessage: reply,
    });
  };

  const handleApplyShortcut = (sc: typeof quickShortcuts[0]) => {
    handleVoiceExtracted(sc.query);
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
            <span>Speak in Hindi / Marathi / English</span>
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
                    <h3 className="font-bold text-sm text-foreground">KaamSetu Voice AI</h3>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                      Multi-Dialect
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Speak your problem naturally in any Indian language
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

            {/* Body */}
            <div className="p-4 overflow-y-auto space-y-4">
              {/* Language Indicator */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/50 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <Volume2 className="h-3.5 w-3.5 text-primary" /> Supported:
                </span>
                <span>हिंदी • मराठी • Hinglish • English</span>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 p-1 bg-muted rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab("record")}
                  className={`py-1.5 rounded-lg transition-all ${
                    activeTab === "record" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Speak Requirement
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("shortcuts")}
                  className={`py-1.5 rounded-lg transition-all ${
                    activeTab === "shortcuts" ? "bg-background shadow-xs text-foreground" : "text-muted-foreground"
                  }`}
                >
                  Quick Scenarios
                </button>
              </div>

              {activeTab === "record" ? (
                <div className="space-y-4">
                  <VoiceRecorder
                    onConfirmText={handleVoiceExtracted}
                    title="Speak Your Need"
                    description="Tell us what you need repaired or done. AI will auto-categorize and route it."
                    placeholderPrompt="Jaise ki: 'Mera kitchen sink leak ho raha hai aur paani beh raha hai'"
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
                    Select a common example to test Voice AI parsing:
                  </p>
                  {quickShortcuts.map((sc, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplyShortcut(sc)}
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
                <MessageSquare className="h-3.5 w-3.5" /> Zero typing required
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  router.push("/voice-ai");
                }}
                className="text-primary hover:underline font-medium"
              >
                Learn more about Voice AI →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
