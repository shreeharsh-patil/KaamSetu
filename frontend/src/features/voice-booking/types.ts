import type { JobTimingOption, JobUrgency, ServiceCategory, ServiceSkill } from "@/features/jobs/types";

export interface JobClassification {
  categorySlug?: string;
  suggestedCategoryName?: string;
  suggestedSkills: string[];
  title?: string;
  description?: string;
  urgency?: JobUrgency;
  timingIntent?: JobTimingOption;
  scheduledAt?: string;
  locationText?: string;
  problemSummary?: string;
  estimatedPrice?: number;
  confidence: number;
}

export interface ResolvedVoiceBooking {
  transcript: string;
  classification: JobClassification;
  category?: ServiceCategory;
  skills: ServiceSkill[];
  confidenceState: "READY" | "LOW_CONFIDENCE" | "NEEDS_SERVICE";
}
