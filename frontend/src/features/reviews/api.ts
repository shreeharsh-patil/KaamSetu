import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { PublicWorkerProfile, CreateReviewInput, WorkerReview } from "./types";

export const reviewsApi = {
  getPublicWorkerProfile: async (workerId: string): Promise<PublicWorkerProfile> => {
    return apiClient.get<PublicWorkerProfile>(API_ENDPOINTS.WORKERS.PROFILE(workerId));
  },

  getWorkerReviews: async (workerId: string): Promise<WorkerReview[]> => {
    const res = await apiClient.get<{ reviews: WorkerReview[] } | WorkerReview[]>(
      API_ENDPOINTS.REVIEWS.WORKER_REVIEWS(workerId)
    );
    if (Array.isArray(res)) return res;
    return res.reviews ?? [];
  },

  submitReview: async (
    jobId: string,
    data: Omit<CreateReviewInput, "jobId">
  ): Promise<{ success: boolean; review: WorkerReview }> => {
    return apiClient.post<{ success: boolean; review: WorkerReview }>(
      API_ENDPOINTS.REVIEWS.CREATE(jobId),
      data
    );
  },
};
