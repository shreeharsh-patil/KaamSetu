"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowRight, CheckCircle2, Mic, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { writeJobDraft } from "@/features/customer/draft-storage";
import { processVoiceBooking } from "@/features/voice-booking/classification";
import type { ResolvedVoiceBooking } from "@/features/voice-booking/types";

export function VoiceAssistantFAB() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<"IDLE" | "UNDERSTANDING" | "READY" | "LOW_CONFIDENCE" | "ERROR">("IDLE");

  const isAuthRoute = ["/login", "/signup", "/verify-otp", "/complete-profile"].some(
    (root) => pathname === root || pathname.startsWith(`${root}/`)
  );

  if (isAuthRoute) return null;
  const [result, setResult] = useState<ResolvedVoiceBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const understand = async (transcript: string) => {
    setState("UNDERSTANDING"); setError(null);
    try {
      const { resolved } = await processVoiceBooking(transcript);
      setResult(resolved);
      setState(resolved.confidenceState === "READY" ? "READY" : "LOW_CONFIDENCE");
    } catch {
      writeJobDraft({ source: "VOICE", originalTranscript: transcript, description: transcript });
      setError("We kept what you said, but could not identify the service. Choose a service in the booking form.");
      setState("ERROR");
    }
  };

  const openBooking = () => { setIsOpen(false); router.push("/customer/jobs/new?source=voice"); };

  return <>
    <button type="button" onClick={() => setIsOpen(true)} aria-label="Book by voice" className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-50 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-gradient-to-tr from-primary to-orange-500 text-white shadow-2xl"><Mic className="h-5 w-5 sm:h-6 sm:w-6" /></button>
    {isOpen ? <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-background/80 p-0 sm:p-4 backdrop-blur-sm"><div className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border bg-card shadow-2xl p-4 space-y-4">
      <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><div><h3 className="font-bold">Prepare a booking by voice</h3><p className="text-xs text-muted-foreground">Hindi, Marathi, Hinglish, or English</p></div></div><Button size="icon" variant="ghost" onClick={() => setIsOpen(false)}><X className="h-4 w-4" /></Button></div>
      {state === "UNDERSTANDING" ? <Card><CardContent className="p-6 text-center text-sm"><Sparkles className="mx-auto mb-2 h-6 w-6 animate-pulse text-primary" />Understanding your request…</CardContent></Card> : null}
      {state === "IDLE" || state === "ERROR" ? <VoiceRecorder onConfirmText={(text) => void understand(text)} title="Speak your need" description="Tell us what needs fixing and when you need it." /> : null}
      {error ? <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{error}</p> : null}
      {result ? <Card className="border-primary/30 bg-primary/5"><CardContent className="space-y-3 p-4 text-sm"><div className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /><div><p className="font-bold">{state === "READY" ? "Booking prepared" : "Please confirm the service"}</p><p>{result.category?.name ?? "Service not identified"}</p><p className="text-muted-foreground">{result.classification.title ?? result.transcript}</p><p className="text-xs text-muted-foreground">{result.classification.timingIntent ?? "Choose a time"} · {result.classification.urgency ?? "FLEXIBLE"}</p></div></div><Button className="w-full" onClick={openBooking}>{state === "READY" ? "Review and find a professional" : "Choose service details"}<ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card> : null}
    </div></div> : null}
  </>;
}
