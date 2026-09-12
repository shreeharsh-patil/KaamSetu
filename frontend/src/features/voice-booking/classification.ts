import { customerApi, type CustomerAddress } from "@/features/customer/api";
import { writeJobDraft, type JobDraft } from "@/features/customer/draft-storage";
import { jobsApi } from "@/features/jobs/api";
import type { JobCreationFormState, ServiceSkill } from "@/features/jobs/types";
import { aiApi } from "./api";
import type { JobClassification, ResolvedVoiceBooking } from "./types";

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\u0900-\u097f]+/g, " ").trim();
const categoryAliases: Record<string, string[]> = { electrical: ["electrician"] };

export function resolveSkills(suggestions: string[], skills: ServiceSkill[]): ServiceSkill[] {
  return skills.filter((skill) => suggestions.some((suggestion) => {
    const expected = normalize(suggestion);
    const candidate = `${normalize(skill.name)} ${normalize(skill.slug)}`;
    return expected.length >= 3 && (candidate.includes(expected) || expected.split(" ").some((word) => word.length > 3 && candidate.includes(word)));
  }));
}

export interface VoiceBookingCompleteness {
  category: boolean;
  problem: boolean;
  timing: boolean;
  location: boolean;
  canReview: boolean;
  missing: Array<"category" | "problem" | "timing" | "location">;
}

/** Resolves AI labels to the IDs accepted by the job API. */
export async function resolveVoiceBooking(transcript: string): Promise<ResolvedVoiceBooking> {
  const classification = await aiApi.classifyJob(transcript);
  const categories = await jobsApi.getCategories();
  const requestedSlug = classification.categorySlug?.toLowerCase();
  const acceptableSlugs = requestedSlug ? [requestedSlug, ...(categoryAliases[requestedSlug] ?? [])] : [];
  const category = requestedSlug
    ? categories.find((item) => acceptableSlugs.includes(item.slug.toLowerCase()))
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

function usefulTitle(title: string | undefined): title is string {
  if (!title) return false;
  const value = title.trim();
  return value.length >= 4 && value.length <= 80 && !/^(book|need|want|find)\b/i.test(value);
}

export function deriveConciseTitle(transcript: string, classification: JobClassification): string {
  if (usefulTitle(classification.title)) return classification.title.trim();
  const lower = transcript.toLowerCase();
  if (/kitchen.*sink.*(leak|drip)|sink.*(leak|drip)/.test(lower)) return "Kitchen sink leaking";
  if (/bathroom.*(tap|pipe).*(leak|drip)|tap.*(leak|drip)/.test(lower)) return "Bathroom tap leaking";
  if (/fan.*(not working|stopped|broken)/.test(lower)) return "Fan not working";
  if (/(pipe|leak|plumb)/.test(lower)) return "Plumbing repair needed";
  if (/(wire|switch|electric|light)/.test(lower)) return "Electrical repair needed";
  return classification.problemSummary?.trim().slice(0, 80) || "Service request";
}

export function defaultAddressToDraft(address?: CustomerAddress | null): Partial<JobDraft> {
  if (!address) return {};
  return {
    addressLine: address.addressLine,
    addressLabel: address.label,
    // Older profiles do not store locality separately. City is a safe, visible fallback.
    locality: address.city,
    city: address.city,
    state: address.state,
    pincode: address.pincode,
    longitude: address.coordinates?.[0],
    latitude: address.coordinates?.[1],
  };
}

export function classificationToDraft(result: ResolvedVoiceBooking, address?: CustomerAddress | null): Partial<JobDraft> {
  const c = result.classification;
  const serviceOnlyRequest = /^(?:please\s+)?(?:book|need|find|want)\s+(?:a\s+)?(?:plumber|electrician|cleaner|painter)\.?$/i.test(result.transcript.trim());
  return {
    version: 3, source: "VOICE", originalTranscript: result.transcript,
    categorySlug: result.category?.slug ?? c.categorySlug, categoryId: result.category?.id,
    requiredSkills: result.skills.map((skill) => skill.id),
    title: serviceOnlyRequest ? "" : deriveConciseTitle(result.transcript, c),
    description: serviceOnlyRequest ? "" : (c.description?.trim() || result.transcript.trim()),
    urgency: c.urgency ?? "FLEXIBLE", timingOption: c.timingIntent ?? "ASAP",
    scheduledAt: c.scheduledAt, estimatedPrice: c.estimatedPrice,
    ...defaultAddressToDraft(address),
    updatedAt: new Date().toISOString(),
  };
}

export function getVoiceBookingCompleteness(form: JobCreationFormState): VoiceBookingCompleteness {
  const category = Boolean(form.categoryId);
  const problem = Boolean(form.title.trim() && form.description.trim());
  const timing = Boolean(form.timingOption) && (form.timingOption !== "SCHEDULED" || Boolean(form.scheduledAt));
  const location = Boolean(form.addressLine.trim() && form.locality.trim() && form.city.trim() && form.state.trim() && /^\d{6}$/.test(form.pincode) && form.latitude !== undefined && form.longitude !== undefined);
  const missing = ([!category && "category", !problem && "problem", !timing && "timing", !location && "location"].filter(Boolean) as VoiceBookingCompleteness["missing"]);
  return { category, problem, timing, location, canReview: missing.length === 0, missing };
}

/** Wizard steps are intentionally skipped when voice already supplied their fields. */
export function getFirstIncompleteStep(form: JobCreationFormState): number {
  const completeness = getVoiceBookingCompleteness(form);
  if (!completeness.category) return 1;
  if (!completeness.problem) return 2;
  if (!completeness.location) return 4;
  if (!completeness.timing) return 5;
  return 6;
}

export interface ProcessedVoiceBooking {
  resolved: ResolvedVoiceBooking;
  draft: Partial<JobDraft>;
}

/** The only transcript-to-booking pipeline used by entry points and the wizard. */
export async function processVoiceBooking(transcript: string): Promise<ProcessedVoiceBooking> {
  const [resolved, profile] = await Promise.all([
    resolveVoiceBooking(transcript),
    customerApi.me().catch(() => null),
  ]);
  const draft = classificationToDraft(resolved, profile?.defaultAddress);
  writeJobDraft(draft);
  return { resolved, draft };
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
    addressLabel: draft.addressLabel ?? form.addressLabel,
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
