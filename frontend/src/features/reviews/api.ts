import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { PublicWorkerProfile, CreateReviewInput, WorkerReview } from "./types";

interface ApiPublicWorkerProfile {
  id: string; displayName: string; bio?: string | null;
  skills: Array<{ skillName?: string; experienceYears: number }>;
  languages: string[]; serviceArea: { city?: string | null };
  pricing: { hourlyRate?: number | null };
  rating: { average: number; count: number }; stats: { completedJobs: number };
  verificationStatus: string;
}

interface ApiReview {
  id: string; rating: number; quality?: number; punctuality?: number;
  communication?: number; comment?: string | null; createdAt: string;
}

function mapReview(review: ApiReview): WorkerReview {
  return {
    id: review.id, customerName: "Verified customer", overallRating: review.rating,
    qualityRating: review.quality ?? review.rating, punctualityRating: review.punctuality ?? review.rating,
    communicationRating: review.communication ?? review.rating, comment: review.comment ?? "",
    createdAt: review.createdAt,
  };
}

export const reviewsApi = {
  getPublicWorkerProfile: async (workerId: string): Promise<PublicWorkerProfile> => {
    const [profile, reviews] = await Promise.all([
      apiClient.get<ApiPublicWorkerProfile>(API_ENDPOINTS.WORKERS.PROFILE(workerId)),
      reviewsApi.getWorkerReviews(workerId),
    ]);
    const experienceYears = Math.max(0, ...profile.skills.map((skill) => skill.experienceYears));
    return {
      id: profile.id, name: profile.displayName, isVerified: profile.verificationStatus === "VERIFIED",
      category: profile.skills[0]?.skillName ?? "Service professional",
      skills: profile.skills.map((skill) => skill.skillName).filter((name): name is string => Boolean(name)),
      experienceYears, languages: profile.languages, averageRating: profile.rating.average,
      totalReviews: profile.rating.count, completedJobsCount: profile.stats.completedJobs,
      approximateLocality: profile.serviceArea.city ?? "Service area available after booking",
      basePricing: profile.pricing.hourlyRate ? { visitCharge: profile.pricing.hourlyRate, hourlyRate: profile.pricing.hourlyRate } : undefined,
      bio: profile.bio ?? undefined, reviews,
    };
  },

  getWorkerReviews: async (workerId: string): Promise<WorkerReview[]> => {
    const res = await apiClient.get<{ items: ApiReview[] }>(
      API_ENDPOINTS.REVIEWS.WORKER_REVIEWS(workerId)
    );
    return res.items.map(mapReview);
  },

  submitReview: async (
    jobId: string,
    data: Omit<CreateReviewInput, "jobId">
  ): Promise<WorkerReview> => {
    const review = await apiClient.post<ApiReview>(API_ENDPOINTS.REVIEWS.CREATE, {
      jobId, rating: data.overallRating, quality: data.qualityRating,
      punctuality: data.punctualityRating, communication: data.communicationRating,
      comment: data.comment,
    });
    return mapReview(review);
  },
};
