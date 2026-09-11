"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Wrench,
  Zap,
  Hammer,
  Paintbrush,
  Sparkles,
  Tv,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  AlertTriangle,
  Upload,
  X,
  Loader2,
  Sparkle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { jobsApi } from "@/features/jobs/api";
import type { CreateJobInput } from "@/features/jobs/types";

const CATEGORIES = [
  { id: "plumbing", name: "Plumbing", icon: Wrench },
  { id: "electrical", name: "Electrical", icon: Zap },
  { id: "carpentry", name: "Carpentry", icon: Hammer },
  { id: "painting", name: "Painting", icon: Paintbrush },
  { id: "cleaning", name: "Cleaning", icon: Sparkles },
  { id: "appliances", name: "Appliances", icon: Tv },
  { id: "masonry", name: "Masonry", icon: Building2 },
];

const STORAGE_KEY = "kaamsetu_job_draft_v1";

export function JobCreationWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCategory = searchParams.get("category");

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateJobInput>({
    category: preselectedCategory || "plumbing",
    subCategory: "",
    title: "",
    description: "",
    urgency: "STANDARD",
    timingOption: "ASAP",
    scheduledAt: "",
    addressLine: "",
    locality: "",
    city: "Mumbai",
    pincode: "",
    landmark: "",
    latitude: 19.076,
    longitude: 72.8777,
    images: [],
  });

  // Restore draft from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist draft to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch {
      // Ignore storage errors
    }
  }, [formData]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          locality: prev.locality || "Current Detected Location",
        }));
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setLocationError(`Could not detect location (${err.message}). Please fill manual address.`);
      },
      { timeout: 10000 }
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      images: [...(prev.images || []), ...newImages].slice(0, 4),
    }));
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index),
    }));
  };

  const handlePublish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await jobsApi.createJob(formData);
      // Clear saved draft
      try {
        sessionStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      router.push(`/customer/jobs/${created._id}/matching`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : "Failed to publish job. Please try again.";
      setSubmitError(msg);
    }
  };

  const totalSteps = 6;
  const progressPercent = Math.round((step / totalSteps) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-muted-foreground">
            Step {step} of {totalSteps}
          </span>
          <span className="font-semibold text-primary">{progressPercent}% complete</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {submitError && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      {/* Step 1: Category */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Service Category</CardTitle>
            <CardDescription>What type of work do you need done today?</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = formData.category.toLowerCase() === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, category: cat.id }))}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border text-center transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <Icon className="h-6 w-6 mb-2" />
                  <span className="text-sm font-semibold">{cat.name}</span>
                </button>
              );
            })}
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={() => setStep(2)}>
              Next: Describe Problem <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Title & Description & Urgency */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Describe Your Requirement</CardTitle>
            <CardDescription>
              Be as specific as possible so nearby professionals can give accurate quotes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Task Title *</label>
              <Input
                placeholder="e.g., Kitchen sink pipe leaking under cabinet"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-foreground">Detailed Description *</label>
                <span className="text-xs text-muted-foreground">{formData.description.length} / 500</span>
              </div>
              <Textarea
                rows={4}
                maxLength={500}
                placeholder="Describe what needs repair, materials available or required, floor number, or any specific instructions..."
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-foreground">Urgency Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "STANDARD", label: "Standard", desc: "Regular service" },
                    { id: "URGENT", label: "Urgent", desc: "Within 2-4 hours" },
                    { id: "EMERGENCY", label: "Emergency", desc: "Immediate help needed" },
                  ] as const
                ).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, urgency: u.id }))}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      formData.urgency === u.id
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-xs font-bold">{u.label}</div>
                    <div className="text-[10px] text-muted-foreground">{u.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              disabled={!formData.title.trim() || !formData.description.trim()}
              onClick={() => setStep(3)}
            >
              Next: Add Photos <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 3: Photos */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Add Photos (Optional)</CardTitle>
            <CardDescription>
              Clear photos of the problem help workers assess tools and spare parts required.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {formData.images?.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {(formData.images?.length || 0) < 4 && (
                <label className="flex flex-col items-center justify-center aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 cursor-pointer transition-colors p-2 text-center bg-muted/20">
                  <Upload className="h-6 w-6 text-muted-foreground mb-1" />
                  <span className="text-xs font-medium text-muted-foreground">Upload Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-muted-foreground">Up to 4 images (JPG, PNG). Max 5MB each.</p>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(4)}>
              Next: Service Location <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 4: Service Location */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Where do you need the service?</CardTitle>
            <CardDescription>
              Nearby workers will be matched based on this locality. Exact address is shared only after assignment.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCurrentLocation}
              disabled={locating}
              className="w-full justify-center border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary"
            >
              {locating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Detecting Location...
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" /> Detect Current Location via GPS
                </>
              )}
            </Button>

            {locationError && (
              <p className="text-xs text-destructive">{locationError}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Locality / Area *</label>
                <Input
                  placeholder="e.g. Andheri West"
                  value={formData.locality}
                  onChange={(e) => setFormData((prev) => ({ ...prev, locality: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">City *</label>
                <Input
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Pincode *</label>
                <Input
                  placeholder="e.g. 400053"
                  maxLength={6}
                  value={formData.pincode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground">Landmark</label>
                <Input
                  placeholder="e.g. Near Metro Station"
                  value={formData.landmark}
                  onChange={(e) => setFormData((prev) => ({ ...prev, landmark: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">House / Flat / Street Address *</label>
              <Input
                placeholder="Flat 302, Green Heights, SV Road"
                value={formData.addressLine}
                onChange={(e) => setFormData((prev) => ({ ...prev, addressLine: e.target.value }))}
              />
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(3)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button
              disabled={!formData.locality.trim() || !formData.addressLine?.trim() || !formData.pincode.trim()}
              onClick={() => setStep(5)}
            >
              Next: Choose Timing <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 5: Preferred Timing */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle>When do you want the service?</CardTitle>
            <CardDescription>Select your preferred arrival window.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(
              [
                { id: "ASAP", title: "As Soon As Possible", desc: "Dispatch nearest available worker immediately" },
                { id: "TODAY", title: "Later Today", desc: "Within regular working hours today" },
                { id: "TOMORROW", title: "Tomorrow", desc: "First available morning slot" },
                { id: "SCHEDULED", title: "Schedule Specific Date", desc: "Choose your preferred date" },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, timingOption: t.id }))}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between transition-all ${
                  formData.timingOption === t.id
                    ? "border-primary bg-primary/10 text-primary shadow-xs"
                    : "border-border text-foreground hover:bg-muted/40"
                }`}
              >
                <div>
                  <h4 className="font-semibold text-sm">{t.title}</h4>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </div>
                {formData.timingOption === t.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
              </button>
            ))}

            {formData.timingOption === "SCHEDULED" && (
              <div className="pt-2">
                <label className="text-xs font-medium text-foreground">Select Date</label>
                <Input
                  type="date"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(4)}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(6)}>
              Next: Review & Publish <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 6: Review & Publish */}
      {step === 6 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Publish Request</CardTitle>
            <CardDescription>
              Double check your booking details before sending out offers to nearby workers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/40 border space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="uppercase text-[10px] tracking-wider mb-1">
                    {formData.category}
                  </Badge>
                  <h3 className="font-bold text-foreground text-base">{formData.title}</h3>
                </div>
                <Badge
                  variant={formData.urgency === "EMERGENCY" ? "destructive" : "secondary"}
                >
                  {formData.urgency}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {formData.description}
              </p>

              <div className="border-t pt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p className="font-medium text-foreground">
                    {formData.locality}, {formData.city} ({formData.pincode})
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Timing:</span>
                  <p className="font-medium text-foreground capitalize">
                    {formData.timingOption.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              </div>

              {formData.images && formData.images.length > 0 && (
                <div className="border-t pt-3">
                  <span className="text-xs text-muted-foreground block mb-1">Attached Photos:</span>
                  <div className="flex gap-2">
                    {formData.images.map((url, i) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={i}
                        src={url}
                        alt="attachment"
                        className="w-12 h-12 object-cover rounded-lg border"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-foreground space-y-1">
              <div className="font-semibold flex items-center gap-1 text-primary">
                <Sparkle className="h-4 w-4" /> Safe Booking Guarantee
              </div>
              <p className="text-muted-foreground">
                No advance charges required to post. You inspect the work and confirm completion using a 4-digit OTP.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(5)} disabled={isSubmitting}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button onClick={handlePublish} disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publishing...
                </>
              ) : (
                "Publish Service Request"
              )}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
