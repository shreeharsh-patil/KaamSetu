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
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/voice/voice-recorder";

export default function VoiceAiPage() {
  const [parsedAnalysis, setParsedAnalysis] = useState<{
    category: string;
    urgency: string;
    locality: string;
    summary: string;
  } | null>(null);

  const samplePrompts = [
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

  const handleApplyVoiceText = (text: string) => {
    const lower = text.toLowerCase();
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
      category,
      urgency,
      locality: "Bandra West, Mumbai (400050)",
      summary: text,
    });
  };

  const handleSelectSample = (sample: typeof samplePrompts[0]) => {
    handleApplyVoiceText(sample.text);
  };

  return (
    <div className="flex-1 w-full py-10 sm:py-16 overflow-hidden">
      <Container>
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-bold tracking-wide animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Next-Gen Hyperlocal Accessibility</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.15]">
            India&apos;s First Voice-First{" "}
            <span className="bg-gradient-to-r from-primary via-orange-500 to-amber-500 bg-clip-text text-transparent">
              Hyperlocal Trade AI
            </span>
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            Zero typing required. Speak naturally in your native language or mother tongue. KaamSetu
            understands regional slang, extracts trade requirements, and instantly pairs you with certified
            tradespeople within minutes.
          </p>

          {/* Supported Language Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {[
              "हिंदी (Hindi)",
              "मराठी (Marathi)",
              "Hinglish",
              "English",
              "ગુજરાતી (Coming soon)",
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
                <Mic className="h-5 w-5" /> Post Job Using Voice
              </Button>
            </Link>
            <Link href="/worker/onboarding">
              <Button size="lg" variant="outline" className="rounded-2xl font-bold px-7 gap-2">
                <Briefcase className="h-5 w-5" /> Worker Voice Onboarding
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Interactive Playground Section */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-card via-card to-background p-6 sm:p-8 shadow-2xl space-y-8">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs uppercase font-bold">
                Interactive Live Demo
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                Experience the Voice AI Engine
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Speak directly through your microphone, or choose a pre-recorded Indian regional voice scenario below.
              </p>
            </div>

            {/* Pre-recorded prompt chips */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-muted-foreground block text-center">
                Or click to test with simulated speech prompts:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {samplePrompts.map((p, i) => (
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
            <div className="max-w-xl mx-auto">
              <VoiceRecorder
                onConfirmText={handleApplyVoiceText}
                title="Voice Input Engine"
                description="Tap to record your requirement in Hindi, Marathi, or English"
                placeholderPrompt="Jaise: 'Bathroom ka tap leak ho raha hai aur paani beh raha hai'"
              />
            </div>

            {/* AI Breakdown Card */}
            {parsedAnalysis && (
              <Card className="border-emerald-500/30 bg-emerald-500/5 animate-in fade-in slide-in-from-bottom-3">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> AI Intent Recognition Result
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                      Confidence 98.4%
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Here is how KaamSetu&apos;s Voice AI converts spoken speech into structured job parameters:
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-xl bg-background/80 border text-xs text-foreground italic">
                    &ldquo;{parsedAnalysis.summary}&rdquo;
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-background border space-y-1 text-center">
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase">
                        Matched Category
                      </span>
                      <span className="font-bold text-primary">{parsedAnalysis.category}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-background border space-y-1 text-center">
                      <span className="text-[10px] text-muted-foreground block font-medium uppercase">
                        Urgency Level
                      </span>
                      <span
                        className={`font-bold ${
                          parsedAnalysis.urgency === "EMERGENCY"
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
                        Dispatch Radius
                      </span>
                      <span className="font-bold text-foreground">3.5 km</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Link
                      href={`/customer/jobs/new?category=${parsedAnalysis.category.toLowerCase()}`}
                    >
                      <Button size="sm" className="rounded-xl font-bold gap-1 text-xs">
                        Create Job with This Voice Input <ArrowRight className="h-3.5 w-3.5" />
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
              Why Voice AI Changes Everything
            </h2>
            <p className="text-sm text-muted-foreground">
              Designed specifically for the diversity, languages, and accessibility needs of Indian trade ecosystems.
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
                desc: "Tradespeople can onboard, state their years of trade experience, and verify skills purely via spoken voice.",
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
              How Voice Booking Works in 4 Steps
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              From spoken word to a verified technician at your doorstep in under 30 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                title: "Speak in Any Dialect",
                desc: "Tap the microphone on your screen and explain your issue exactly like you'd speak to a neighbor.",
              },
              {
                step: "02",
                title: "AI Translates & Categorizes",
                desc: "Our model structures your speech into trade category, problem severity, and tools required.",
              },
              {
                step: "03",
                title: "Hyperlocal Dispatch",
                desc: "Nearby verified professionals receive instant notifications in their preferred language.",
              },
              {
                step: "04",
                title: "OTP-Protected Service",
                desc: "Worker arrives, solves the problem, and finishes the job with digital OTP verification.",
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
              Ready to experience effortless service booking?
            </h2>
            <p className="text-white/90 text-sm sm:text-base">
              Try posting your first job with voice in under 15 seconds. No account preparation required.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/customer/jobs/new">
              <Button size="lg" variant="secondary" className="rounded-2xl font-bold px-8 text-foreground gap-2">
                <Mic className="h-5 w-5 text-primary" /> Try Voice Post Now
              </Button>
            </Link>
            <Link href="/services">
              <Button size="lg" variant="outline" className="rounded-2xl font-bold px-8 bg-transparent text-white border-white/40 hover:bg-white/10">
                Explore All Services
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
