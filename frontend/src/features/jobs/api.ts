import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { Job, CreateJobInput, JobOffer } from "./types";

export interface JobsResponse {
  jobs: Job[];
  total: number;
}

export const jobsApi = {
  getJobs: async (params?: { role?: "customer" | "worker"; status?: string }): Promise<Job[]> => {
    const query = new URLSearchParams();
    if (params?.role) query.append("role", params.role);
    if (params?.status) query.append("status", params.status);
    const url = `${API_ENDPOINTS.JOBS.LIST}${query.toString() ? `?${query.toString()}` : ""}`;
    const res = await apiClient.get<JobsResponse | Job[]>(url);
    if (Array.isArray(res)) return res;
    return res.jobs ?? [];
  },

  getJobById: async (id: string): Promise<Job> => {
    return apiClient.get<Job>(API_ENDPOINTS.JOBS.DETAIL(id));
  },

  createJob: async (data: CreateJobInput): Promise<Job> => {
    return apiClient.post<Job>(API_ENDPOINTS.JOBS.CREATE, data);
  },

  cancelJob: async (id: string, reason: string): Promise<{ success: boolean; job: Job }> => {
    return apiClient.post<{ success: boolean; job: Job }>(API_ENDPOINTS.JOBS.CANCEL(id), { reason });
  },

  getJobMatchingStatus: async (jobId: string): Promise<{ status: Job["status"]; job: Job }> => {
    return apiClient.get<{ status: Job["status"]; job: Job }>(API_ENDPOINTS.JOBS.MATCHING(jobId));
  },

  getWorkerOffers: async (): Promise<JobOffer[]> => {
    const res = await apiClient.get<{ offers: JobOffer[] } | JobOffer[]>(API_ENDPOINTS.OFFERS.LIST);
    if (Array.isArray(res)) return res;
    return res.offers ?? [];
  },

  getOfferById: async (offerId: string): Promise<JobOffer> => {
    return apiClient.get<JobOffer>(API_ENDPOINTS.OFFERS.DETAIL(offerId));
  },

  acceptOffer: async (offerId: string): Promise<{ success: boolean; jobId: string }> => {
    return apiClient.post<{ success: boolean; jobId: string }>(API_ENDPOINTS.OFFERS.ACCEPT(offerId), {});
  },

  declineOffer: async (offerId: string): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(API_ENDPOINTS.OFFERS.DECLINE(offerId), {});
  },

  advanceJobState: async (
    jobId: string,
    action: "start-travel" | "arrive" | "start-work" | "complete",
    payload?: Record<string, unknown>
  ): Promise<Job> => {
    let endpoint: string;
    switch (action) {
      case "start-travel":
        endpoint = API_ENDPOINTS.JOBS.START_TRAVEL(jobId);
        break;
      case "arrive":
        endpoint = API_ENDPOINTS.JOBS.ARRIVE(jobId);
        break;
      case "start-work":
        endpoint = API_ENDPOINTS.JOBS.START_WORK(jobId);
        break;
      case "complete":
        endpoint = API_ENDPOINTS.JOBS.COMPLETE(jobId);
        break;
    }
    return apiClient.post<Job>(endpoint, payload ?? {});
  },

  verifyOtp: async (jobId: string, otp: string, type: "start" | "complete"): Promise<{ verified: boolean; job: Job }> => {
    return apiClient.post<{ verified: boolean; job: Job }>(API_ENDPOINTS.JOBS.VERIFY_OTP(jobId), { otp, type });
  },
};
