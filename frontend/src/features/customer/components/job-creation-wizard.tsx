"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import {
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
  Mic,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { jobsApi } from "@/features/jobs/api";
import { mapJobCreationFormToApi } from "@/features/jobs/mappers";
import type { JobCreationFormState } from "@/features/jobs/types";
import { putPresignedFile, uploadsApi } from "@/features/uploads/api";
import { clearJobDraft, readJobDraft, writeJobDraft } from "@/features/customer/draft-storage";
import { applyVoiceDraft, getFirstIncompleteStep, getVoiceBookingCompleteness, processVoiceBooking } from "@/features/voice-booking/classification";
import { customerApi } from "@/features/customer/api";

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 5;

interface UploadItem {
  file: File;
  previewUrl: string;
  uploadId?: string;
  key?: string;
  progress: number;
  status: "uploading" | "complete" | "error";
  error?: string;
}

export function JobCreationWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCategory = searchParams.get("category");
  const requestedVoiceFlow = searchParams.get("source") === "voice";

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftHydrated, setDraftHydrated] = useState(false);

  const [formData, setFormData] = useState<JobCreationFormState>({
    categoryId: "",
    requiredSkills: [],
    title: "",
    description: "",
    urgency: "FLEXIBLE",
    timingOption: "ASAP",
    scheduledAt: "",
    addressLine: "",
    locality: "",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "",
    images: [],
  });
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const previewUrls = useRef(new Set<string>());
  const categoriesQuery = useQuery({ queryKey: ["service-categories"], queryFn: jobsApi.getCategories });
  const customerQuery = useQuery({ queryKey: ["customer", "profile"], queryFn: customerApi.me });
  const skillsQuery = useQuery({ queryKey: ["service-skills", formData.categoryId], queryFn: () => jobsApi.getSkills(formData.categoryId), enabled: Boolean(formData.categoryId) });

  useEffect(() => {
    if (!preselectedCategory || formData.categoryId || !categoriesQuery.data) return;
    const match = categoriesQuery.data.find((category) => category.id === preselectedCategory || category.slug === preselectedCategory);
    if (match) setFormData((value) => ({ ...value, categoryId: match.id }));
  }, [categoriesQuery.data, formData.categoryId, preselectedCategory]);

  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.current.clear();
  }, []);

  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceSuccessMsg, setVoiceSuccessMsg] = useState<string | null>(null);

  const handleVoiceExtracted = async (extractedText: string) => {
    const trimmed = extractedText.trim();
    if (!trimmed) return;
    try {
      const { draft } = await processVoiceBooking(trimmed);
      const next = applyVoiceDraft(formData, draft);
      setFormData(next);
      setStep(getFirstIncompleteStep(next));
      setVoiceSuccessMsg("Booking details prepared from your voice. Review the remaining item, if any.");
    } catch {
      const fallback = { source: "VOICE" as const, originalTranscript: trimmed, description: trimmed };
      writeJobDraft(fallback);
      setFormData((prev) => applyVoiceDraft(prev, fallback));
      setVoiceSuccessMsg("Your transcript was saved. Choose a service to complete the booking.");
    }
    setIsVoiceMode(false);
  };

  useEffect(() => {
    const saved = readJobDraft();
    if (saved) {
      const next = applyVoiceDraft(formData, saved);
      setFormData(next);
      if (requestedVoiceFlow || next.source === "VOICE") setStep(getFirstIncompleteStep(next));
    }
    setDraftHydrated(true);
  }, [requestedVoiceFlow]);

  useEffect(() => {
    const address = customerQuery.data?.defaultAddress;
    if (!address || formData.addressLine || formData.latitude !== undefined) return;
    const next = {
      ...formData, addressLine: address.addressLine, locality: address.city, city: address.city, state: address.state,
      pincode: address.pincode, longitude: address.coordinates?.[0], latitude: address.coordinates?.[1],
    };
    setFormData(next);
    if (next.source === "VOICE") setStep(getFirstIncompleteStep(next));
  }, [customerQuery.data, formData]);

  useEffect(() => {
    if (!draftHydrated) return;
    writeJobDraft(formData);
  }, [draftHydrated, formData]);

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

  const uploadImage = async (item: UploadItem) => {
    let uploadId: string | undefined;
    setUploads((items) => items.map((value) => value.previewUrl === item.previewUrl ? { ...value, status: "uploading", progress: 0, error: undefined } : value));
    try {
      const presigned = await uploadsApi.presign(item.file);
      uploadId = presigned.uploadId;
      setUploads((items) => items.map((value) => value.previewUrl === item.previewUrl ? { ...value, uploadId: presigned.uploadId } : value));
      await putPresignedFile(item.file, presigned, (progress) => setUploads((items) => items.map((value) => value.previewUrl === item.previewUrl ? { ...value, progress } : value)));
      const completed = await uploadsApi.complete(presigned.uploadId);
      setUploads((items) => items.map((value) => value.previewUrl === item.previewUrl ? { ...value, key: completed.key, progress: 100, status: "complete" } : value));
      setFormData((value) => ({ ...value, images: [...value.images, { key: completed.key, mimeType: completed.mimeType }] }));
    } catch (reason) {
      if (uploadId) {
        try { await uploadsApi.remove(uploadId); } catch { /* cleanup is best effort */ }
      }
      setUploads((items) => items.map((value) => value.previewUrl === item.previewUrl ? { ...value, status: "error", error: reason instanceof Error ? reason.message : "Upload failed" } : value));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, MAX_IMAGES - uploads.length);
    const invalid = files.find((file) => !ALLOWED_IMAGE_TYPES.has(file.type) || file.size > MAX_IMAGE_BYTES);
    if (invalid) { setSubmitError("Images must be JPG, PNG, or WebP and no larger than 5 MB."); return; }
    const items = files.map((file) => {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.current.add(previewUrl);
      return { file, previewUrl, progress: 0, status: "uploading" as const };
    });
    setUploads((current) => [...current, ...items]);
    items.forEach((item) => void uploadImage(item));
    e.target.value = "";
  };

  const handleRemoveImage = async (index: number) => {
    const item = uploads[index];
    if (!item) return;
    URL.revokeObjectURL(item.previewUrl);
    previewUrls.current.delete(item.previewUrl);
    setUploads((items) => items.filter((_, itemIndex) => itemIndex !== index));
    if (item.key) setFormData((value) => ({ ...value, images: value.images.filter((image) => image.key !== item.key) }));
    if (item.uploadId) { try { await uploadsApi.remove(item.uploadId); } catch { /* cleanup is best effort */ } }
  };

  const handlePublish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      if (uploads.some((item) => item.status === "uploading")) throw new Error("Wait for image uploads to finish.");
      const created = await jobsApi.createJob(mapJobCreationFormToApi(formData));
      // Clear saved draft
      try {
        clearJobDraft();
      } catch {
        // ignore
      }
      uploads.forEach((item) => {
        URL.revokeObjectURL(item.previewUrl);
        previewUrls.current.delete(item.previewUrl);
      });
      router.push(`/customer/jobs/${created.id}/matching`);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : "Failed to publish job. Please try again.";
      setSubmitError(msg);
    }
  };

  const totalSteps = 6;
  const progressPercent = Math.round((step / totalSteps) * 100);
  const voiceCompleteness = getVoiceBookingCompleteness(formData);

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

      {formData.source === "VOICE" && !voiceCompleteness.canReview && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3 text-sm text-foreground">
          <span className="font-semibold">Voice booking saved.</span>{" "}
          {voiceCompleteness.missing.includes("problem") ? "Tell us a little more about the problem." : "Confirm the remaining booking detail to continue."}
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
            {categoriesQuery.data?.map((cat) => {
              const isSelected = formData.categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, categoryId: cat.id, requiredSkills: [] }))}
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary shadow-xs font-bold"
                      : "border-border hover:bg-muted/40 text-foreground"
                  }`}
                >
                  <Building2 className="h-6 w-6 mb-2" />
                  <span className="text-sm font-semibold">{cat.name}</span>
                </button>
              );
            })}
            <div className="col-span-full flex flex-wrap gap-2">
              {skillsQuery.data?.map((skill) => (
                <button key={skill.id} type="button" onClick={() => setFormData((value) => ({ ...value, requiredSkills: value.requiredSkills.includes(skill.id) ? value.requiredSkills.filter((id) => id !== skill.id) : [...value.requiredSkills, skill.id] }))} className={`rounded-full border px-3 py-2 text-xs ${formData.requiredSkills.includes(skill.id) ? "bg-primary text-primary-foreground" : "bg-background"}`}>
                  {skill.name}
                </button>
              ))}
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button disabled={!formData.categoryId} onClick={() => setStep(2)} className="rounded-xl font-bold">
              Next: Describe Problem <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 2: Title & Description & Urgency */}
      {step === 2 && (
        <Card className="rounded-xl shadow-xs border border-border/80">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                Describe Your Requirement
              </CardTitle>
              <CardDescription>
                Be as specific as possible so nearby professionals can give accurate quotes.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant={isVoiceMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsVoiceMode(!isVoiceMode)}
              className="rounded-xl text-xs font-bold gap-1.5 shrink-0"
            >
              <Mic className="h-3.5 w-3.5" />
              {isVoiceMode ? "Switch to Typing" : "Speak (Voice AI)"}
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {voiceSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-4 w-4" /> {voiceSuccessMsg}
                </span>
                <button
                  type="button"
                  onClick={() => setVoiceSuccessMsg(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {isVoiceMode ? (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                  💡 Speak in Hindi, Marathi, or English. Describe what needs fixing, where, and how quickly. The AI will transcribe and auto-fill your title and description!
                </div>
                <VoiceRecorder
                  onConfirmText={handleVoiceExtracted}
                  title="Speak Your Problem"
                  description="Press start, describe the issue, and tap stop when done."
                  placeholderPrompt="e.g., 'Bathroom ka pipe leak ho raha hai aur tap se paani tapak raha hai. Jaldi plumber chahiye.'"
                />
              </div>
            ) : null}

            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">Task Title *</label>
              <Input
                placeholder="e.g., Kitchen sink pipe leaking under cabinet"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                className="rounded-xl"
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
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium text-foreground">Urgency Level</label>
              <div className="grid grid-cols-3 gap-2.5">
                {(
                  [
                    { id: "FLEXIBLE", label: "Flexible", desc: "Schedule within your preferred window" },
                    { id: "TODAY", label: "Today", desc: "Service needed today" },
                    { id: "EMERGENCY", label: "Emergency", desc: "Immediate help needed" },
                  ] as const
                ).map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, urgency: u.id }))}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      formData.urgency === u.id
                        ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                        : "border-border text-foreground hover:bg-muted/40"
                    }`}
                  >
                    <div className="text-xs font-bold">{u.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{u.desc}</div>
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
              {uploads.map((item, i) => (
                <div key={item.previewUrl} className="relative aspect-square rounded-xl overflow-hidden border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.previewUrl} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] text-white">{item.status === "complete" ? "Uploaded" : item.status === "error" ? "Failed" : `${item.progress}%`}</span>
                  {item.status === "error" ? <button type="button" onClick={() => void uploadImage({ ...item, status: "uploading", progress: 0 })} className="absolute bottom-1 right-1 rounded bg-white px-1 text-[10px] text-black">Retry</button> : null}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black text-white rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {uploads.length < MAX_IMAGES && (
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
            <p className="text-xs text-muted-foreground">Up to 5 images (JPG, PNG, WebP). Max 5MB each.</p>
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
                <label className="text-xs font-medium text-foreground">State *</label>
                <Input
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
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
              disabled={!formData.locality.trim() || !formData.addressLine.trim() || !formData.city.trim() || !formData.state.trim() || !/^\d{6}$/.test(formData.pincode) || formData.latitude === undefined || formData.longitude === undefined}
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
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  formData.timingOption === t.id
                    ? "border-primary bg-primary/10 text-primary font-bold shadow-xs"
                    : "border-border text-foreground hover:bg-muted/40"
                }`}
              >
                <div>
                  <h4 className="font-bold text-sm">{t.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                </div>
                {formData.timingOption === t.id && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
              </button>
            ))}

            {formData.timingOption === "SCHEDULED" && (
              <div className="pt-2">
                <label className="text-xs font-medium text-foreground">Select Date</label>
                <Input
                  type="date"
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => setStep(4)} className="rounded-xl">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            <Button onClick={() => setStep(6)} className="rounded-xl font-bold">
              Next: Review & Publish <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Step 6: Review & Publish */}
      {step === 6 && (
        <Card className="rounded-xl shadow-xs border border-border/80">
          <CardHeader>
            <CardTitle>Review & Publish Request</CardTitle>
            <CardDescription>
              Double check your booking details before sending out offers to nearby workers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-5 rounded-2xl bg-secondary/80 border border-border/70 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <Badge variant="outline" className="uppercase text-[10px] tracking-wider mb-1">
                    {categoriesQuery.data?.find((category) => category.id === formData.categoryId)?.name ?? "Service"}
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

              {uploads.length > 0 && (
                <div className="border-t pt-3">
                  <span className="text-xs text-muted-foreground block mb-1">Attached Photos:</span>
                  <div className="flex gap-2">
                    {uploads.map((item) => (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        key={item.previewUrl}
                        src={item.previewUrl}
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
                No advance charges are required to post. Job progress is recorded by authenticated state transitions.
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
