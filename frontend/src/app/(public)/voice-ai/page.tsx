"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mic,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Globe,
  Users,
  Briefcase,
  Play,
  User,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/voice/voice-recorder";

export default function VoiceAiPage() {
  const [activeRole, setActiveRole] = useState<"customer" | "worker">("customer");
  const [parsedAnalysis, setParsedAnalysis] = useState<{
    role: "customer" | "worker";
    category: string;
    actionIntent: string;
    urgency: string;
    locality: string;
    summary: string;
    targetUrl: string;
    actionButtonText: string;
  } | null>(null);

  const customerPrompts = [
    {
      lang: "Hindi (हिंदी)",
      label: "Plumbing Leak",
      text: "Kitchen ke sink ke neeche se paani beh raha hai aur pipe tut gaya hai, emergency hai jaldi plumber bhejo.",
      category: "Plumbing",
      urgency: "EMERGENCY",
      locality: "Detected from GPS",
    },
    {
      lang: "Marathi (मराठी)",
      label: "Electrical Spark",
      text: "हॉलमधील मुख्य स्वीच बोर्डमधून ठिणग्या येत आहेत आणि लाईट बंद झाली आहे. वायरमन पाठवा.",
      category: "Electrical",
      urgency: "URGENT",
      locality: "Detected from GPS",
    },
    {
      lang: "Hinglish",
      label: "AC Water Dropping",
      text: "Bedroom ka split AC on karne par water drop ho raha hai aur cooling bilkul nahi ho rahi.",
      category: "Appliances",
      urgency: "STANDARD",
      locality: "Detected from GPS",
    },
    {
      lang: "Hindi (हिंदी)",
      label: "Carpenter Work",
      text: "Main door ka lock jam ho gaya hai aur chabi ghum nahi rahi. Carpenter ki zarurat hai.",
      category: "Carpentry",
      urgency: "URGENT",
      locality: "Detected from GPS",
    },
  ];

  const workerPrompts = [
    {
      lang: "Hindi (हिंदी)",
      label: "Search Jobs Nearby",
      text: "Bandra aur Andheri me geyser socket replacement ke urgent electrician kaam dikhao.",
      category: "Electrical",
      urgency: "URGENT",
      locality: "Bandra & Andheri West",
    },
    {
      lang: "Marathi (मराठी)",
      label: "Worker Lead Search",
      text: "मला दादर आणि माटुंगा भागातील पाईप लिकेज आणि प्लंबिंगची नवीन कामे दाखवा.",
      category: "Plumbing",
      urgency: "IMMEDIATE",
      locality: "Dadar & Matunga",
    },
    {
      lang: "Hinglish",
      label: "Check Ledger / Earnings",
      text: "Meri aaj ki total kamai aur completed jobs ka escrow payout status check karo.",
      category: "Earnings & Ledger",
      urgency: "INFO",
      locality: "Mumbai Region",
    },
    {
      lang: "Hindi (हिंदी)",
      label: "Toggle Availability",
      text: "Aaj ka kaam khatam ho gaya hai, abhi mujhe offline rest mode me mark karo.",
      category: "Availability Status",
      urgency: "STATUS",
      locality: "Active Zone",
    },
  ];

  const handleApplyVoiceText = (text: string) => {
    const lower = text.toLowerCase();

    if (activeRole === "worker") {
      let category = "Electrical";
      let actionIntent = "DISPATCH_LEAD_SEARCH";
      let urgency = "STANDARD";
      let targetUrl = `/worker?search=${encodeURIComponent(text)}`;
      let actionButtonText = "Filter Worker Job Feed";

      if (lower.includes("plumb") || lower.includes("प्लंबिंग") || lower.includes("पाईप") || lower.includes("pipe")) {
        category = "Plumbing";
      } else if (lower.includes("kamai") || lower.includes("earn") || lower.includes("payout") || lower.includes("ledger")) {
        category = "Earnings";
        actionIntent = "LEDGER_SUMMARY";
        targetUrl = "/worker/earnings";
        actionButtonText = "View Worker Earnings Ledger";
      } else if (lower.includes("offline") || lower.includes("online") || lower.includes("available") || lower.includes("status")) {
        category = "Status Control";
        actionIntent = "TOGGLE_AVAILABILITY";
        targetUrl = "/worker";
        actionButtonText = "Update Status in Worker Radar";
      }

      if (lower.includes("urgent") || lower.includes("immediate") || lower.includes("jaldi")) {
        urgency = "URGENT";
      }

      setParsedAnalysis({
        role: "worker",
        category,
        actionIntent,
        urgency,
        locality: "Mumbai Hyperlocal Grid (15km radius)",
        summary: text,
        targetUrl,
        actionButtonText,
      });
      return;
    }

    // Customer parsing
    let category = "Plumbing";
    let urgency = "STANDARD";

    if (lower.includes("light") || lower.includes("स्वीच") || lower.includes("wire") || lower.includes("electric")) {
      category = "Electrical";
    } else if (lower.includes("ac") || lower.includes("cooling") || lower.includes("fridge")) {
      category = "Appliances";
    } else if (lower.includes("door") || lower.includes("lock") || lower.includes("carpenter")) {
      category = "Carpentry";
    }

    if (lower.includes("emergency") || lower.includes("tut") || lower.includes("ठिणग्या")) {
      urgency = "EMERGENCY";
    } else if (lower.includes("jaldi") || lower.includes("urgent") || lower.includes("jam")) {
      urgency = "URGENT";
    }

    setParsedAnalysis({
      role: "customer",
      category,
      actionIntent: "CUSTOMER_SERVICE_REQUEST",
      urgency,
      locality: "Bandra West, Mumbai (400050)",
      summary: text,
      targetUrl: `/customer/jobs/new?category=${category.toLowerCase()}`,
      actionButtonText: `Create ${category} Job Request`,
    });
  };

  const handleSelectSample = (sample: { text: string }) => {
    handleApplyVoiceText(sample.text);
  };

  return (
    <div className="flex-1 w-full py-10 sm:py-16 overflow-hidden">
      <Container>
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wide animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Dual-Sided Voice AI for Workers & Customers</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            India&apos;s First Voice-First{" "}
            <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Hyperlocal Trade AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Zero typing required for both <strong>Customers</strong> and <strong>Skilled Workers</strong>. Speak
            naturally in Hindi, Marathi, Hinglish, or English. Customers book jobs in seconds, while workers
            discover leads, toggle availability, and check daily payouts completely hands-free.
          </p>

          {/* Supported Language Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              "🇮🇳 Hindi (हिंदी)",
              "🚩 Marathi (मराठी)",
              "⚡ Hinglish (हिंग्लिश)",
              "💬 Indian English",
            ].map((lang, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="px-3 py-1 rounded-full text-xs font-semibold bg-secondary/80 border border-border"
              >
                {lang}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/customer/jobs/new">
              <Button size="lg" className="rounded-2xl font-bold px-7 gap-2 shadow-lg shadow-primary/20">
                <Mic className="h-5 w-5" /> Customer Voice Post
              </Button>
            </Link>
            <Link href="/worker">
              <Button size="lg" variant="outline" className="rounded-2xl font-bold px-7 gap-2">
                <Briefcase className="h-5 w-5" /> Worker Voice Radar
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Interactive Playground Section with Dual Role Mode */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-card via-card to-background p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs uppercase font-bold">
                Interactive Live Demo
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Experience the Voice AI Engine
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Select your perspective below, then speak into your microphone or click a simulated regional prompt.
              </p>
            </div>

            {/* Role Switcher in Playground */}
            <div className="flex justify-center">
              <div className="inline-flex p-1 rounded-2xl bg-muted border border-border text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setActiveRole("customer");
                    setParsedAnalysis(null);
                  }}
                  className={`px-5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeRole === "customer"
                      ? "bg-background text-foreground shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <User className="h-4 w-4" /> For Customers (ग्राहक सेवा)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveRole("worker");
                    setParsedAnalysis(null);
                  }}
                  className={`px-5 py-2 rounded-xl transition-all flex items-center gap-2 ${
                    activeRole === "worker"
                      ? "bg-primary text-white shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Briefcase className="h-4 w-4" /> For Workers (कारीगर काम)
                </button>
              </div>
            </div>

            {/* Pre-recorded prompt chips */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block text-center">
                Click a simulated {activeRole === "worker" ? "worker" : "customer"} scenario:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(activeRole === "worker" ? workerPrompts : customerPrompts).map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSelectSample(p)}
                    className="p-3.5 rounded-2xl border border-border bg-card/50 hover:bg-primary/5 hover:border-primary/40 text-left transition-all flex items-start gap-3 group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Play className="h-3.5 w-3.5 fill-current" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{p.label}</span>
                        <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {p.lang}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 italic">
                        &ldquo;{p.text}&rdquo;
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* The live recorder component */}
            <div className="pt-2">
              <VoiceRecorder
                onConfirmText={handleApplyVoiceText}
                title={
                  activeRole === "worker"
                    ? "Speak as a Skilled Worker (कारीगर आवाज़)"
                    : "Speak as a Customer (समस्या बोलें)"
                }
                description={
                  activeRole === "worker"
                    ? "Try commands like: 'Andheri me electrician kaam dikhao' or 'Meri aaj ki kamai batao'."
                    : "Explain what requires repair in your native language. AI categorizes and dispatches instantly."
                }
                placeholderPrompt={
                  activeRole === "worker"
                    ? "उदा.: 'Bandra me wiring ke urgent kaam dikhao'"
                    : "उदा.: 'Ghar me switchboard me spark ho raha hai aur light chali gayi'"
                }
              />
            </div>

            {/* Parsed AI Result Card */}
            {parsedAnalysis && (
              <Card className="border-primary/40 bg-primary/5 rounded-2xl animate-in fade-in slide-in-from-bottom-3">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base font-bold">
                        AI Intent Decoded ({parsedAnalysis.role === "worker" ? "Worker Mode" : "Customer Mode"})
                      </CardTitle>
                    </div>
                    <Badge variant="default" className="text-xs font-mono">
                      100% Confidence
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-muted-foreground italic pt-1">
                    &ldquo;{parsedAnalysis.summary}&rdquo;
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2.5 rounded-xl bg-background border space-y-1 text-center">
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase">
                        Trade / Intent
                      </span>
                      <span className="font-bold text-foreground">{parsedAnalysis.category}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border space-y-1 text-center">
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase">
                        Operation
                      </span>
                      <span className="font-bold text-foreground">{parsedAnalysis.actionIntent}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border space-y-1 text-center">
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase">
                        Priority Tier
                      </span>
                      <span
                        className={`font-bold ${
                          parsedAnalysis.urgency === "EMERGENCY" || parsedAnalysis.urgency === "IMMEDIATE"
                            ? "text-red-500"
                            : parsedAnalysis.urgency === "URGENT"
                            ? "text-amber-500"
                            : "text-blue-500"
                        }`}
                      >
                        {parsedAnalysis.urgency}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border space-y-1 text-center">
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase">
                        Geo Grid
                      </span>
                      <span className="font-bold text-foreground">15 km Active</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Link href={parsedAnalysis.targetUrl}>
                      <Button size="sm" className="rounded-xl font-bold gap-1 text-xs">
                        {parsedAnalysis.actionButtonText} <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* 4 Feature Pillars */}
        <div className="mb-20 space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground">
              Why Dual-Sided Voice AI Changes Everything
            </h2>
            <p className="text-sm text-muted-foreground">
              Designed specifically for the diversity, languages, and literacy levels of Indian trade ecosystems.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Globe,
                title: "Multilingual & Dialects",
                desc: "Trained on regional Hindi, Marathi, Hinglish, and colloquial terms (e.g. 'nal mistri', 'short circuit', 'tank leakage').",
              },
              {
                icon: Zap,
                title: "Instant Parameter Extraction",
                desc: "Automatically identifies problem severity, required tools, parts needed, and urgency tier without manual dropdowns.",
              },
              {
                icon: Users,
                title: "Empowering Skilled Workers",
                desc: "Tradespeople can onboard, state their years of trade experience, listen to customer audio notes, and filter leads via voice.",
              },
              {
                icon: ShieldCheck,
                title: "Voice OTP & Audio Proof",
                desc: "Work verification and completion OTPs can be read out and confirmed with hands-free audio assistance.",
              },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <Card key={i} className="rounded-3xl border hover:border-primary/40 transition-all hover:shadow-lg group">
                  <CardHeader>
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors">
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-base font-bold">{f.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {f.desc}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* How It Works Steps */}
        <div className="mb-20 p-8 sm:p-12 rounded-3xl bg-secondary/40 border border-border space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
              How Voice Booking & Worker Dispatch Works
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              From customer spoken word to worker audio notification and verified completion.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Customer Speaks Requirement",
                desc: "Customer speaks problem naturally. AI structures the trade category, tools required, and urgency tier.",
              },
              {
                step: "02",
                title: "Audio Dispatch to Workers",
                desc: "Nearby verified professionals receive instant notifications with audio memos playable directly on their device.",
              },
              {
                step: "03",
                title: "Worker Voice Acceptance",
                desc: "Workers filter and accept jobs hands-free while on the road without manual mobile keyboard input.",
              },
              {
                step: "04",
                title: "Audio OTP Verification",
                desc: "Worker arrives, completes the service, and verifies the job safely with voice-enabled OTP confirmation.",
              },
            ].map((s, idx) => (
              <div key={idx} className="space-y-2.5">
                <span className="font-mono text-3xl sm:text-4xl font-extrabold text-primary/40">
                  {s.step}
                </span>
                <h3 className="font-bold text-sm sm:text-base text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-primary via-orange-600 to-amber-600 p-8 sm:p-12 text-white shadow-2xl text-center space-y-6">
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-extrabold">
              Ready to experience effortless voice trade marketplace?
            </h2>
            <p className="text-white/90 text-sm sm:text-base">
              Try posting your first job or browsing worker leads with voice in under 15 seconds.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/customer/jobs/new">
              <Button size="lg" variant="secondary" className="rounded-2xl font-bold px-8 text-foreground gap-2">
                <Mic className="h-5 w-5 text-primary" /> Try Customer Voice
              </Button>
            </Link>
            <Link href="/worker">
              <Button size="lg" variant="outline" className="rounded-2xl font-bold px-8 bg-transparent text-white border-white/40 hover:bg-white/10 gap-2">
                <Briefcase className="h-5 w-5" /> Explore Worker Radar
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
