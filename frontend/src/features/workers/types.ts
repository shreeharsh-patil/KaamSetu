export interface WorkerProfileData {
  fullName: string;
  primaryCategory: string;
  skillIds: string[];
  yearsExperience: number;
  bio?: string;
  hourlyRate?: number;
  serviceRadiusKm: number;
  city: string;
  pincode: string;
  coordinates?: [number, number];
  isAvailable: boolean;
}

export interface WorkerSkillOption {
  id: string;
  name: string;
  category: string;
}

export interface WorkerJobOffer {
  id: string;
  jobId: string;
  category: string;
  title: string;
  description: string;
  approximateArea: string;
  distanceKm: number;
  urgency: "IMMEDIATE" | "TODAY" | "SCHEDULED";
  estimatedPrice: number;
  preferredTime: string;
  expiresAt: string;
}
