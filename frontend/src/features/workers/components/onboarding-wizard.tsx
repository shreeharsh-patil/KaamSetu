"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Zap,
  Droplets,
  Hammer,
  Wrench,
  Paintbrush,
  BrickWall,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  IndianRupee,
  Navigation,
  Mic,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { VoiceProfileBuilder, type ExtractedWorkerProfile } from "@/components/voice/voice-profile-builder";
import type { WorkerProfileData } from "../types";

const TRADE_CATEGORIES = [
  { id: "electrician", name: "Electrician", icon: Zap, skills: ["House Wiring", "MCB Repair", "Fan Installation", "Inverter Setup", "Short Circuit Repair"] },
  { id: "plumber", name: "Plumber", icon: Droplets, skills: ["Pipe Leakage", "Tap Repair", "Motor Pump", "Bathroom Fittings", "Drainage Cleaning"] },
  { id: "carpenter", name: "Carpenter", icon: Hammer, skills: ["Door Alignment", "Furniture Repair", "Lock Repair", "Modular Kitchen", "Wood Polishing"] },
  { id: "appliance", name: "Appliance Technician", icon: Wrench, skills: ["AC Servicing", "Refrigerator Repair", "Washing Machine", "Microwave Repair"] },
  { id: "painter", name: "Painter", icon: Paintbrush, skills: ["Interior Wall Painting", "Waterproofing", "Exterior Texture", "Wall Putty"] },
  { id: "mason", name: "Mason / Helper", icon: BrickWall, skills: ["Tile Laying", "Brickwork", "Plastering", "Concrete Work"] },
];

const STORAGE_KEY = "kaamsetu_worker_onboarding_draft";

export function OnboardingWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 6;

  const [formData, setFormData] = useState<WorkerProfileData>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // ignore corrupted data
        }
      }
    }
    return {
      fullName: "",
      primaryCategory: "electrician",
      skillIds: ["House Wiring", "MCB Repair"],
      yearsExperience: 3,
      bio: "",
      hourlyRate: 350,
      serviceRadiusKm: 15,
      city: "Mumbai",
      pincode: "400001",
      isAvailable: true,
    };
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [showVoiceHelper, setShowVoiceHelper] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const handleVoiceProfileExtracted = (extracted: ExtractedWorkerProfile) => {
    setFormData((prev) => ({
      ...prev,
      primaryCategory: extracted.trade || prev.primaryCategory,
      yearsExperience: extracted.yearsExperience ?? prev.yearsExperience,
      skillIds: extracted.skills.length > 0 ? extracted.skills : prev.skillIds,
      bio: extracted.bio || prev.bio,
    }));
    setVoiceNotice(
      `Voice AI applied: ${extracted.trade?.toUpperCase()} (${extracted.yearsExperience} yrs exp, ${extracted.skills.length} skills)`
    );
    setShowVoiceHelper(false);
  };

  // Autosave to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  const selectedTrade = TRADE_CATEGORIES.find((t) => t.id === formData.primaryCategory) || TRADE_CATEGORIES[0]!;

  const handleToggleSkill = (skill: string) => {
    setFormData((prev) => {
      const exists = prev.skillIds.includes(skill);
      const updated = exists ? prev.skillIds.filter((s) => s !== skill) : [...prev.skillIds, skill];
      return { ...prev, skillIds: updated };
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      return;
    }

    setIsDetectingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          coordinates: [pos.coords.longitude, pos.coords.latitude],
        }));
        setIsDetectingLocation(false);
      },
      () => {
        setError("Location permission denied. Please enter your pincode and city manually.");
        setIsDetectingLocation(false);
      },
      { timeout: 8000 }
    );
  };

  const handleNext = () => {
    setError(null);
    if (currentStep === 2 && !formData.fullName.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (currentStep === 3 && formData.skillIds.length === 0) {
      setError("Please select at least one core skill");
      return;
    }
    if (currentStep === 4 && (!formData.city || !formData.pincode)) {
      setError("Please provide city and 6-digit pincode");
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((s) => s + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      setIsSubmitting(true);
      // Simulate API registration checkpoint
      await new Promise((resolve) => setTimeout(resolve, 800));
      sessionStorage.removeItem(STORAGE_KEY);
      router.push("/worker?onboarded=true");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <Card className="max-w-xl mx-auto shadow-md border-border">
      <CardHeader className="pb-3 border-b">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Step {currentStep} of {totalSteps}</span>
          <span className="font-semibold text-primary">{Math.round(progressPercent)}% Completed</span>
        </div>
        <Progress value={progressPercent} className="h-1.5 mb-2" />
        <CardTitle className="text-xl sm:text-2xl font-bold">
          {currentStep === 1 && "Select Your Primary Trade"}
          {currentStep === 2 && "Profile & Experience"}
          {currentStep === 3 && "Skills & Specializations"}
          {currentStep === 4 && "Service Area & Radius"}
          {currentStep === 5 && "Pricing & Daily Availability"}
          {currentStep === 6 && "Review & Complete"}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {currentStep === 1 && "Choose the main skilled service category you provide to customers."}
          {currentStep === 2 && "Your name and experience will appear on customer job proposals."}
          {currentStep === 3 && "Select the specific tasks you are experienced and comfortable doing."}
          {currentStep === 4 && "Set where you operate to receive nearby job alerts."}
          {currentStep === 5 && "Set your expected rate and daily dispatch availability."}
          {currentStep === 6 && "Check your profile details before activating your tradesperson account."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Voice AI Assistant helper */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-xs font-semibold text-foreground">
              Don&apos;t want to type?
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowVoiceHelper(!showVoiceHelper)}
            className="rounded-xl text-xs font-bold gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
          >
            <Mic className="h-3.5 w-3.5" />
            {showVoiceHelper ? "Hide Voice Setup" : "Setup Profile with Voice AI"}
          </Button>
        </div>

        {voiceNotice && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between">
            <span>{voiceNotice}</span>
            <button
              type="button"
              onClick={() => setVoiceNotice(null)}
              className="text-muted-foreground hover:text-foreground font-bold px-1"
            >
              ✕
            </button>
          </div>
        )}

        {showVoiceHelper && (
          <VoiceProfileBuilder onProfileExtracted={handleVoiceProfileExtracted} />
        )}

        {error && (
          <Alert variant="destructive" className="text-xs">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Trade Category */}
        {currentStep === 1 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {TRADE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.primaryCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      primaryCategory: cat.id,
                      skillIds: cat.skills.slice(0, 2),
                    }))
                  }
                  className={cn(
                    "flex items-center gap-3.5 p-4 rounded-xl border text-left transition-all min-h-touch",
                    isSelected
                      ? "border-primary bg-primary/5 text-primary shadow-xs ring-1 ring-primary"
                      : "hover:bg-muted/50 border-border text-foreground"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-lg shrink-0",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{cat.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{cat.skills.length} core tasks</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 2: Personal Profile */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Full Name (as per Aadhaar)</label>
              <Input
                placeholder="e.g. Ramesh Kumar"
                value={formData.fullName}
                onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Years in Trade</label>
              <Input
                type="number"
                min={0}
                max={50}
                value={formData.yearsExperience}
                onChange={(e) => setFormData((prev) => ({ ...prev, yearsExperience: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Short Bio / Trade Background</label>
              <Textarea
                placeholder="e.g. Certified wireman with 5 years experience in residential wiring and industrial switches."
                value={formData.bio || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Step 3: Skills Chips */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Tap the skills you specialize in:</p>
            <div className="flex flex-wrap gap-2">
              {selectedTrade.skills.map((skill) => {
                const isSelected = formData.skillIds.includes(skill);

                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleToggleSkill(skill)}
                    className={cn(
                      "px-3.5 py-2 rounded-full text-xs font-medium border transition-colors select-none min-h-touch flex items-center gap-1.5",
                      isSelected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-input hover:bg-muted"
                    )}
                  >
                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>{skill}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Service Area */}
        {currentStep === 4 && (
          <div className="space-y-5">
            <Button
              type="button"
              variant="outline"
              onClick={detectLocation}
              isLoading={isDetectingLocation}
              leftIcon={<Navigation className="h-4 w-4 text-primary" />}
              className="w-full justify-center"
            >
              Detect Current Location via GPS
            </Button>

            {formData.coordinates && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>GPS coordinates calibrated</span>
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">City / District</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">6-Digit Pincode</label>
                <Input
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-foreground">Maximum Service Radius</span>
                <span className="font-bold text-primary">{formData.serviceRadiusKm} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={formData.serviceRadiusKm}
                onChange={(e) => setFormData((prev) => ({ ...prev, serviceRadiusKm: Number(e.target.value) }))}
                className="w-full accent-primary cursor-pointer h-2 bg-muted rounded-lg"
              />
              <p className="text-[11px] text-muted-foreground">
                You will receive job notifications within this travel distance.
              </p>
            </div>
          </div>
        )}

        {/* Step 5: Pricing & Availability */}
        {currentStep === 5 && (
          <div className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Base Hourly / Inspection Rate (₹)</label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min={100}
                  step={50}
                  value={formData.hourlyRate || ""}
                  onChange={(e) => setFormData((prev) => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                  className="pl-9 text-base font-semibold"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Customers see this as your standard rate for routine repairs.
              </p>
            </div>

            <div className="rounded-xl border p-4 bg-muted/20">
              <Switch
                id="onboarding-available"
                checked={formData.isAvailable}
                onCheckedChange={(val) => setFormData((prev) => ({ ...prev, isAvailable: val }))}
                label="Start as Available Immediately"
                description="Begin receiving job leads right after completing this onboarding"
              />
            </div>
          </div>
        )}

        {/* Step 6: Review & Complete */}
        {currentStep === 6 && (
          <div className="space-y-4 text-sm">
            <div className="rounded-xl border p-4 space-y-3 bg-muted/10">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground text-xs">Primary Trade</span>
                <span className="font-bold text-foreground capitalize">{selectedTrade.name}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground text-xs">Full Name</span>
                <span className="font-semibold text-foreground">{formData.fullName}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground text-xs">Experience</span>
                <span className="font-semibold text-foreground">{formData.yearsExperience} Years</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground text-xs">Base Rate</span>
                <span className="font-bold text-primary">₹{formData.hourlyRate} / hr</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-xs">Coverage Area</span>
                <span className="font-semibold text-foreground">{formData.city} ({formData.serviceRadiusKm} km radius)</span>
              </div>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300">
              By activating, you agree to KaamSetu&apos;s fair pricing and transparent trade standards.
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t bg-muted/10 pt-4 flex justify-between gap-3">
        {currentStep > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setCurrentStep((s) => s - 1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>
        ) : (
          <div />
        )}

        <Button
          type="button"
          onClick={handleNext}
          isLoading={isSubmitting}
          rightIcon={currentStep < totalSteps ? <ArrowRight className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
        >
          {currentStep < totalSteps ? "Continue" : "Activate Worker Profile"}
        </Button>
      </CardFooter>
    </Card>
  );
}
