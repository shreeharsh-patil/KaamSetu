"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { CheckCircle2, MapPin, Navigation } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/features/auth/use-auth";
import { workersApi } from "../api";
import type { SkillLevel, WorkerAvailability, WorkerEnrollmentRequest } from "../types";

const STORAGE_KEY = "kaamsetu_worker_onboarding_draft";
type Draft = Omit<WorkerEnrollmentRequest, "serviceLocation" | "skills"> & {
  coordinates?: [number, number];
  skillIds: string[];
  experienceYears: number;
  skillLevel: SkillLevel;
};

const INITIAL_DRAFT: Draft = {
  displayName: "",
  primaryCategoryId: "",
  skillIds: [],
  experienceYears: 0,
  skillLevel: "INTERMEDIATE",
  bio: "",
  languages: ["en"],
  serviceArea: { city: "", pincode: "" },
  serviceRadiusKm: 15,
  pricing: { hourlyRate: 350, currency: "INR" },
  availabilityStatus: "OFFLINE",
};

export function OnboardingWizard() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [draft, setDraft] = useState<Draft>(() => {
    if (typeof window === "undefined") return INITIAL_DRAFT;
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_DRAFT;
    try { return { ...INITIAL_DRAFT, ...JSON.parse(saved) as Draft }; } catch { return INITIAL_DRAFT; }
  });
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); }, [draft]);

  const categoriesQuery = useQuery({ queryKey: ["service-categories"], queryFn: workersApi.categories });
  const skillsQuery = useQuery({
    queryKey: ["service-skills", draft.primaryCategoryId],
    queryFn: () => workersApi.skills(draft.primaryCategoryId),
    enabled: Boolean(draft.primaryCategoryId),
  });
  const enrollMutation = useMutation({
    mutationFn: workersApi.enroll,
    onSuccess: async () => {
      sessionStorage.removeItem(STORAGE_KEY);
      await refreshUser();
      router.replace("/worker");
    },
    onError: (reason) => setError(reason instanceof Error ? reason.message : "Worker enrollment failed"),
  });

  const detectLocation = () => {
    if (!navigator.geolocation) { setError("Geolocation is not supported by this browser."); return; }
    setLocating(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => { setDraft((value) => ({ ...value, coordinates: [coords.longitude, coords.latitude] })); setLocating(false); },
      () => { setError("Location permission is required before your profile can receive nearby jobs."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const toggleSkill = (skillId: string) => setDraft((value) => ({
    ...value,
    skillIds: value.skillIds.includes(skillId) ? value.skillIds.filter((id) => id !== skillId) : [...value.skillIds, skillId],
  }));

  const submit = () => {
    setError(null);
    if (!draft.displayName.trim() || !draft.primaryCategoryId || draft.skillIds.length === 0) return setError("Name, category, and at least one skill are required.");
    if (!draft.coordinates) return setError("Confirm your real location with GPS before enrolling.");
    if (!/^\d{6}$/.test(draft.serviceArea.pincode) || draft.serviceArea.city.trim().length < 2) return setError("Enter a valid city and six-digit pincode.");
    enrollMutation.mutate({
      displayName: draft.displayName.trim(), primaryCategoryId: draft.primaryCategoryId,
      skills: draft.skillIds.map((skillId) => ({ skillId, experienceYears: draft.experienceYears, level: draft.skillLevel })),
      bio: draft.bio?.trim(), languages: draft.languages,
      serviceLocation: { type: "Point", coordinates: draft.coordinates }, serviceArea: draft.serviceArea,
      serviceRadiusKm: draft.serviceRadiusKm, pricing: draft.pricing, availabilityStatus: draft.availabilityStatus,
    });
  };

  const loadingError = categoriesQuery.error || skillsQuery.error;
  return (
    <Card className="max-w-2xl mx-auto shadow-md border-border">
      <CardHeader>
        <CardTitle>Activate your worker profile</CardTitle>
        <CardDescription>Your profile stays offline until real category, skills, and location data are saved.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(error || loadingError) ? <Alert variant="destructive"><AlertDescription>{error || (loadingError instanceof Error ? loadingError.message : "Could not load service catalogue")}</AlertDescription></Alert> : null}

        <section className="space-y-3">
          <h2 className="text-sm font-bold">Identity and experience</h2>
          <Input aria-label="Full name" placeholder="Full name" value={draft.displayName} onChange={(event) => setDraft((value) => ({ ...value, displayName: event.target.value }))} />
          <Textarea aria-label="Bio" placeholder="Describe your trade experience" value={draft.bio} onChange={(event) => setDraft((value) => ({ ...value, bio: event.target.value }))} />
          <div className="grid sm:grid-cols-2 gap-3">
            <Input aria-label="Years of experience" type="number" min={0} max={50} value={draft.experienceYears} onChange={(event) => setDraft((value) => ({ ...value, experienceYears: Number(event.target.value) }))} />
            <Input aria-label="Languages" placeholder="Languages: en, hi, mr" value={draft.languages.join(", ")} onChange={(event) => setDraft((value) => ({ ...value, languages: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold">Real service category</h2>
          <div className="grid sm:grid-cols-2 gap-2">
            {categoriesQuery.data?.map((category) => <button type="button" key={category.id} onClick={() => setDraft((value) => ({ ...value, primaryCategoryId: category.id, skillIds: [] }))} className={`rounded-xl border p-3 text-left text-sm ${draft.primaryCategoryId === category.id ? "border-primary bg-primary/10 font-bold" : "border-border"}`}>{category.name}</button>)}
          </div>
          {draft.primaryCategoryId ? <div className="flex flex-wrap gap-2">{skillsQuery.data?.map((skill) => <button type="button" key={skill.id} onClick={() => toggleSkill(skill.id)} className={`rounded-full border px-3 py-2 text-xs ${draft.skillIds.includes(skill.id) ? "bg-primary text-primary-foreground" : "bg-background"}`}>{skill.name}</button>)}</div> : null}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-bold">Service location and pricing</h2>
          <Button type="button" variant="outline" onClick={detectLocation} isLoading={locating} leftIcon={<Navigation className="h-4 w-4" />}>Use my current location</Button>
          {draft.coordinates ? <p className="text-xs text-emerald-700 flex gap-1"><MapPin className="h-4 w-4" />Location confirmed ({draft.coordinates[1].toFixed(4)}, {draft.coordinates[0].toFixed(4)})</p> : null}
          <div className="grid sm:grid-cols-2 gap-3">
            <Input aria-label="Service city" placeholder="City" value={draft.serviceArea.city} onChange={(event) => setDraft((value) => ({ ...value, serviceArea: { ...value.serviceArea, city: event.target.value } }))} />
            <Input aria-label="Service pincode" placeholder="Pincode" maxLength={6} value={draft.serviceArea.pincode} onChange={(event) => setDraft((value) => ({ ...value, serviceArea: { ...value.serviceArea, pincode: event.target.value.replace(/\D/g, "") } }))} />
            <Input aria-label="Service radius" type="number" min={1} max={100} value={draft.serviceRadiusKm} onChange={(event) => setDraft((value) => ({ ...value, serviceRadiusKm: Number(event.target.value) }))} />
            <Input aria-label="Hourly rate" type="number" min={1} value={draft.pricing.hourlyRate ?? ""} onChange={(event) => setDraft((value) => ({ ...value, pricing: { ...value.pricing, hourlyRate: Number(event.target.value) } }))} />
          </div>
          <label className="text-sm flex items-center gap-3">Initial availability
            <select className="rounded-lg border bg-background p-2" value={draft.availabilityStatus} onChange={(event) => setDraft((value) => ({ ...value, availabilityStatus: event.target.value as WorkerAvailability }))}>
              <option value="OFFLINE">Offline</option><option value="AVAILABLE">Available</option>
            </select>
          </label>
        </section>
      </CardContent>
      <CardFooter className="justify-end"><Button onClick={submit} isLoading={enrollMutation.isPending} rightIcon={<CheckCircle2 className="h-4 w-4" />}>Activate worker profile</Button></CardFooter>
    </Card>
  );
}
