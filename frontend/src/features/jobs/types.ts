export type JobStatus =
  | "DRAFT" | "OPEN" | "MATCHING" | "OFFERED" | "ACCEPTED" | "EN_ROUTE"
  | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED" | "EXPIRED";

export type JobUrgency = "FLEXIBLE" | "TODAY" | "EMERGENCY";
export type JobTimingOption = "ASAP" | "TODAY" | "TOMORROW" | "SCHEDULED";

export interface ServiceCategory { id: string; name: string; slug: string; description?: string | null; icon?: string | null; active?: boolean }
export interface ServiceSkill { id: string; name: string; slug: string; categoryId: string }
export interface JobImage { key: string; width?: number; height?: number; mimeType?: string }

export interface JobCreationFormState {
  source?: "APP" | "VOICE";
  categoryId: string;
  requiredSkills: string[];
  title: string;
  description: string;
  urgency: JobUrgency;
  timingOption: JobTimingOption;
  scheduledAt?: string;
  addressLine: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  images: JobImage[];
  estimatedPrice?: number;
}

export interface CreateJobApiRequest {
  categoryId: string;
  requiredSkills: string[];
  title: string;
  description: string;
  source: "APP" | "VOICE" | "SUPPORT";
  location: { type: "Point"; coordinates: [number, number] };
  address: { line: string; city: string; state: string; pincode: string };
  preferredTime: string;
  urgency: JobUrgency;
  estimatedPrice?: number;
  images: JobImage[];
  publishImmediately: boolean;
}

export interface ApiJobView extends Omit<CreateJobApiRequest, "publishImmediately"> {
  id: string;
  customerId: string;
  assignedWorkerId?: string | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  category: ServiceCategory;
  customer: { id: string; displayName: string; phoneNumber?: string };
  assignedWorker?: {
    id: string; displayName: string; phoneNumber?: string; profilePhotoUrl?: string | null;
    rating: { average: number; count: number }; skills: string[];
    verificationStatus: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  } | null;
}

export interface Job {
  id: string;
  customer: { id: string; name: string; phone?: string };
  worker?: { id: string; name: string; phone?: string; avatarUrl?: string; rating: number; totalReviews: number; skills: string[]; isVerified: boolean };
  category: string;
  title: string;
  description: string;
  urgency: JobUrgency;
  preferredTime: string;
  location: { addressLine: string; locality: string; city: string; state: string; pincode: string; latitude: number; longitude: number };
  images: JobImage[];
  status: JobStatus;
  estimatedPrice?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiJobOfferView {
  id: string; jobId: string; workerId?: string; distanceKm: number; matchScore: number;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "WITHDRAWN";
  expiresAt: string; createdAt: string;
  job: { category: ServiceCategory; title: string; description?: string | null; urgency: JobUrgency; approximateLocality: string; preferredTime: string; estimatedAmount?: number | null };
}

export interface JobOffer {
  id: string; jobId: string; category: string; title: string; description: string; urgency: JobUrgency;
  approximateLocality: string; distanceKm: number; preferredTime: string; estimatedAmount?: number;
  expiresAt: string; status: ApiJobOfferView["status"];
}

export type JobPresentationStatus = "SEARCHING" | "WAITING_FOR_ACCEPTANCE" | "WORKER_ASSIGNED" | "TRAVELLING" | "ARRIVED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED" | "EXPIRED" | "DRAFT";
