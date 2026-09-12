export type WorkerAvailability = "AVAILABLE" | "BUSY" | "OFFLINE";
export type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "EXPERT";

export interface WorkerEnrollmentRequest {
  displayName: string;
  primaryCategoryId: string;
  skills: Array<{ skillId: string; experienceYears: number; level: SkillLevel }>;
  bio?: string;
  languages: string[];
  serviceLocation: { type: "Point"; coordinates: [number, number] };
  serviceArea: { city: string; pincode: string };
  serviceRadiusKm: number;
  pricing: { hourlyRate?: number; customRateDescription?: string; currency: "INR" };
  availabilityStatus: WorkerAvailability;
}

export interface WorkerProfile {
  id: string; userId: string; displayName: string; bio?: string | null; primaryCategoryId?: string;
  skills: Array<{ skillId: string; skillName?: string; experienceYears: number; level: SkillLevel; verified: boolean }>;
  languages: string[]; serviceLocation?: { type: "Point"; coordinates: [number, number] };
  serviceArea?: { city?: string | null; pincode?: string | null; radiusKm: number };
  serviceRadiusKm: number; availabilityStatus: WorkerAvailability; onboardingComplete: boolean;
  pricing: { hourlyRate?: number | null; customRateDescription?: string | null; currency?: string };
  rating: { average: number; count: number }; stats: { completedJobs: number; cancelledJobs: number };
}
