import { jobsApi } from "@/features/jobs/api";
import type { JobCreationFormState, ServiceSkill } from "@/features/jobs/types";
import type { JobDraft } from "@/features/customer/draft-storage";
import { aiApi } from "./api";
import type { ResolvedVoiceBooking } from "./types";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, " ").trim();

export function resolveSkills(suggestions: string[], skills: ServiceSkill[]): ServiceSkill[] {
  return skills.filter((skill) => suggestions.some((suggestion) => {
    const expected = normalize(suggestion);
    const candidate = `${normalize(skill.name)} ${normalize(skill.slug)}`;
    return expected.length >= 3 && (candidate.includes(expected) || expected.split(" ").some((word) => word.length > 3 && candidate.includes(word)));
  }));
}

export async function classifyTranscript(transcript: string): Promise<ResolvedVoiceBooking> {
  const classification = await aiApi.classifyJob(transcript);
  const categories = await jobsApi.getCategories();
  const category = classification.categorySlug
    ? categories.find((item) => item.slug.toLowerCase() === classification.categorySlug?.toLowerCase())
    : undefined;
  const skills = category ? resolveSkills(classification.suggestedSkills, await jobsApi.getSkills(category.id)) : [];
  return {
    transcript,
    classification,
    category,
    skills,
    confidenceState: classification.confidence >= 0.75 && category ? "READY" : classification.confidence >= 0.45 && category ? "LOW_CONFIDENCE" : "NEEDS_SERVICE",
  };
}

export function classificationToDraft(result: ResolvedVoiceBooking): Partial<JobDraft> {
  const c = result.classification;
  return {
    version: 3, source: "VOICE", originalTranscript: result.transcript,
    categorySlug: result.category?.slug ?? c.categorySlug, categoryId: result.category?.id,
    requiredSkills: result.skills.map((skill) => skill.id),
    title: c.title ?? c.problemSummary, description: c.description ?? result.transcript,
    urgency: c.urgency ?? "FLEXIBLE", timingOption: c.timingIntent,
    scheduledAt: c.scheduledAt, estimatedPrice: c.estimatedPrice,
    updatedAt: new Date().toISOString(),
  };
}

export function applyVoiceDraft(form: JobCreationFormState, draft: Partial<JobDraft>): JobCreationFormState {
  return {
    ...form,
    source: draft.source ?? form.source,
    categoryId: draft.categoryId ?? form.categoryId,
    requiredSkills: draft.requiredSkills ?? form.requiredSkills,
    title: draft.title ?? form.title,
    description: draft.description ?? form.description,
    urgency: draft.urgency ?? form.urgency,
    timingOption: draft.timingOption ?? form.timingOption,
    scheduledAt: draft.scheduledAt ?? form.scheduledAt,
    addressLine: draft.addressLine ?? form.addressLine,
    locality: draft.locality ?? form.locality,
    city: draft.city ?? form.city,
    state: draft.state ?? form.state,
    pincode: draft.pincode ?? form.pincode,
    latitude: draft.latitude ?? form.latitude,
    longitude: draft.longitude ?? form.longitude,
    estimatedPrice: draft.estimatedPrice ?? form.estimatedPrice,
  };
}
