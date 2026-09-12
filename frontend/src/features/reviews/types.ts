export interface WorkerReview {
  id: string;
  customerName: string;
  customerAvatar?: string;
  overallRating: number;
  qualityRating: number;
  punctualityRating: number;
  communicationRating: number;
  comment: string;
  createdAt: string;
}

export interface CreateReviewInput {
  jobId: string;
  overallRating: number;
  qualityRating?: number;
  punctualityRating?: number;
  communicationRating?: number;
  comment?: string;
}

export interface PublicWorkerProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  isVerified: boolean;
  category: string;
  skills: string[];
  experienceYears: number;
  languages: string[];
  averageRating: number;
  totalReviews: number;
  completedJobsCount: number;
  approximateLocality: string;
  basePricing?: {
    visitCharge: number;
    hourlyRate?: number;
  };
  bio?: string;
  reviews: WorkerReview[];
}
