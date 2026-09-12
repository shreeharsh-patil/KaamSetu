import type { JobTimingOption, JobUrgency } from "@/features/jobs/types";

export interface JobDraft {
  version?: 3;
  source?: "APP" | "VOICE";
  originalTranscript?: string;
  categorySlug?: string;
  categoryId?: string;
  category?: string; // category slug or name fallback
  requiredSkills?: string[];
  title?: string;
  description?: string;
  urgency?: JobUrgency;
  timingOption?: JobTimingOption;
  scheduledAt?: string;
  addressLabel?: string;
  addressLine?: string;
  locality?: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  estimatedPrice?: number;
  updatedAt?: string;
}

export const PRIMARY_DRAFT_KEY = "kaamsetu_job_draft_v2";
export const LEGACY_DRAFT_KEY = "kaamsetu_job_draft_v1";

export function readJobDraft(): JobDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const rawV2 = sessionStorage.getItem(PRIMARY_DRAFT_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2);
      if (parsed && typeof parsed === "object") {
        return parsed as JobDraft;
      }
    }

    // Migration check from v1
    const rawV1 = sessionStorage.getItem(LEGACY_DRAFT_KEY);
    if (rawV1) {
      const parsed = JSON.parse(rawV1);
      if (parsed && typeof parsed === "object") {
        const draft: JobDraft = {
          ...parsed,
          category: parsed.category,
        };
        sessionStorage.setItem(PRIMARY_DRAFT_KEY, JSON.stringify(draft));
        sessionStorage.removeItem(LEGACY_DRAFT_KEY);
        return draft;
      }
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

export function writeJobDraft(draft: Partial<JobDraft>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readJobDraft() || {};
    const merged = { ...existing, ...draft, version: 3 as const, updatedAt: new Date().toISOString() };
    sessionStorage.setItem(PRIMARY_DRAFT_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage errors
  }
}

export function clearJobDraft(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(PRIMARY_DRAFT_KEY);
    sessionStorage.removeItem(LEGACY_DRAFT_KEY);
  } catch {
    // Ignore storage errors
  }
}
