export type JobStatus =
  | "DRAFT"
  | "SEARCHING"
  | "WORKERS_FOUND"
  | "WAITING_FOR_ACCEPTANCE"
  | "WORKER_ASSIGNED"
  | "NO_WORKERS"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "EXPIRED"
  | "DISPUTED";

export type JobUrgency = "STANDARD" | "URGENT" | "EMERGENCY";

export type JobTimingOption = "ASAP" | "TODAY" | "TOMORROW" | "SCHEDULED";

export interface JobLocation {
  addressLine?: string;
  locality: string;
  city: string;
  pincode: string;
  landmark?: string;
  latitude: number;
  longitude: number;
}

export interface AssignedWorkerSummary {
  _id: string;
  name: string;
  avatarUrl?: string;
  rating: number;
  totalReviews: number;
  phone?: string;
  skills: string[];
  isVerified: boolean;
}

export interface Job {
  _id: string;
  customer: {
    _id: string;
    name: string;
    phone?: string;
  };
  worker?: AssignedWorkerSummary;
  category: string;
  subCategory?: string;
  title: string;
  description: string;
  urgency: JobUrgency;
  timing: {
    option: JobTimingOption;
    scheduledAt?: string;
  };
  location: JobLocation;
  images: string[];
  status: JobStatus;
  estimatedPrice?: {
    min: number;
    max: number;
  };
  finalPrice?: number;
  startOtpRequired?: boolean;
  completionOtpRequired?: boolean;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobInput {
  category: string;
  subCategory?: string;
  title: string;
  description: string;
  urgency: JobUrgency;
  timingOption: JobTimingOption;
  scheduledAt?: string;
  addressLine?: string;
  locality: string;
  city: string;
  pincode: string;
  landmark?: string;
  latitude: number;
  longitude: number;
  images?: string[];
}

export interface JobOffer {
  _id: string;
  jobId: string;
  category: string;
  title: string;
  description: string;
  urgency: JobUrgency;
  approximateLocality: string;
  distanceKm: number;
  preferredTiming: string;
  estimatedPrice: {
    min: number;
    max: number;
  };
  expiresAt: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "TAKEN";
}
