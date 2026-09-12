"use client";

import { useState } from "react";
import { Sparkles, Check, RotateCcw, Award, Briefcase, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { VoiceRecorder } from "@/components/voice/voice-recorder";

export interface ExtractedWorkerProfile {
  trade?: string;
  yearsExperience?: number;
  skills: string[];
  bio: string;
}

export interface VoiceProfileBuilderProps {
  onProfileExtracted: (data: ExtractedWorkerProfile) => void;
  className?: string;
}

export function VoiceProfileBuilder({ onProfileExtracted, className = "" }: VoiceProfileBuilderProps) {
  const [extractedData, setExtractedData] = useState<ExtractedWorkerProfile | null>(null);
  const [isDone, setIsDone] = useState(false);

  const parseWorkerSpeech = (rawText: string): ExtractedWorkerProfile => {
    const lower = rawText.toLowerCase();

    // 1. Detect Trade
    let trade = "electrician";
    if (lower.includes("plumb") || lower.includes("nal") || lower.includes("pipe") || lower.includes("leak") || lower.includes("tap")) {
      trade = "plumber";
    } else if (lower.includes("carpent") || lower.includes("badhai") || lower.includes("wood") || lower.includes("furniture") || lower.includes("darwaza")) {
      trade = "carpenter";
    } else if (lower.includes("paint") || lower.includes("rang") || lower.includes("putty")) {
      trade = "painter";
    } else if (lower.includes("appliance") || lower.includes("ac") || lower.includes("fridge") || lower.includes("washing")) {
      trade = "appliance";
    } else if (lower.includes("mason") || lower.includes("mistri") || lower.includes("tile") || lower.includes("brick")) {
      trade = "mason";
    }

    // 2. Detect Years of Experience
    let yearsExperience = 4;
    const yearMatch = lower.match(/(\d+)\s*(saal|years|year|varsh)/);
    if (yearMatch && yearMatch[1]) {
      yearsExperience = Math.min(40, Math.max(1, parseInt(yearMatch[1], 10)));
    } else if (lower.includes("panch") || lower.includes("paanch") || lower.includes("five")) {
      yearsExperience = 5;
    } else if (lower.includes("dus") || lower.includes("das") || lower.includes("ten")) {
      yearsExperience = 10;
    }

    // 3. Detect Skills based on trade
    const skills: string[] = [];
    if (trade === "electrician") {
      skills.push("House Wiring", "MCB Repair");
      if (lower.includes("fan") || lower.includes("pankha")) skills.push("Fan Installation");
      if (lower.includes("inverter")) skills.push("Inverter Setup");
      if (lower.includes("circuit")) skills.push("Short Circuit Repair");
    } else if (trade === "plumber") {
      skills.push("Pipe Leakage", "Tap Repair");
      if (lower.includes("tank") || lower.includes("motor")) skills.push("Motor Pump");
      if (lower.includes("bathroom") || lower.includes("fitting")) skills.push("Bathroom Fittings");
      if (lower.includes("drain") || lower.includes("gutter")) skills.push("Drainage Cleaning");
    } else if (trade === "carpenter") {
      skills.push("Door Alignment", "Furniture Repair");
      if (lower.includes("lock") || lower.includes("tala")) skills.push("Lock Repair");
      if (lower.includes("kitchen")) skills.push("Modular Kitchen");
    } else if (trade === "painter") {
      skills.push("Interior Wall Painting", "Wall Putty");
    } else {
      skills.push("General Repairs");
    }

    // 4. Generate clean professional bio
    const bio = `Skilled ${trade.charAt(0).toUpperCase() + trade.slice(1)} with ${yearsExperience}+ years of field experience in ${skills.join(", ")}. Dedicated to prompt, quality service and transparent work.`;

    return { trade, yearsExperience, skills, bio };
  };

  const handleSpeechRecorded = (rawText: string) => {
    const parsed = parseWorkerSpeech(rawText);
    setExtractedData(parsed);
    setIsDone(false);
  };

  const handleApply = () => {
    if (extractedData) {
      onProfileExtracted(extractedData);
      setIsDone(true);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {!extractedData ? (
        <Card className="border-dashed border-primary/40 bg-gradient-to-br from-primary/5 via-card to-background">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Voice Profile Auto-Fill
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] font-semibold">
                AI Powered
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Tell us your trade and experience in Hindi, Marathi, or English. We will auto-fill your profile details!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <VoiceRecorder
              onConfirmText={handleSpeechRecorded}
              title="Speak About Your Trade Experience"
              description="Tap to record. State your trade, how many years you've worked, and your main specialties."
              placeholderPrompt="Main 6 saal se electrician ka kaam karta hu, house wiring aur MCB repair karta hu..."
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="border-primary/40 shadow-sm bg-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" /> Extracted Trade Profile
              </CardTitle>
              <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                Parsed Successfully
              </Badge>
            </div>
            <CardDescription className="text-xs">
              Review what the Voice AI understood from your speech:
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5 text-primary" /> Detected Trade
                </span>
                <p className="font-bold text-sm capitalize text-foreground">{extractedData.trade}</p>
              </div>

              <div className="p-3 rounded-xl bg-muted/50 space-y-1">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-primary" /> Experience
                </span>
                <p className="font-bold text-sm text-foreground">{extractedData.yearsExperience} Years</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-primary" /> Core Skills Tagged:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {extractedData.skills.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-foreground">Generated Bio:</span>
              <p className="text-xs text-muted-foreground bg-muted/30 p-2.5 rounded-xl border border-border">
                {extractedData.bio}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExtractedData(null)}
              className="text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Re-record
            </Button>
            <Button
              size="sm"
              onClick={handleApply}
              disabled={isDone}
              className="text-xs font-bold gap-1"
            >
              {isDone ? (
                <>
                  <Check className="h-3.5 w-3.5" /> Applied to Profile
                </>
              ) : (
                "Apply to Onboarding Form"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
