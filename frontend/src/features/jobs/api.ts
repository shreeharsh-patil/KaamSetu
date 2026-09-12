import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { mapApiJobToView, mapApiOfferToView } from "./mappers";
import type { ApiJobOfferView, ApiJobView, CreateJobApiRequest, Job, JobOffer, ServiceCategory, ServiceSkill } from "./types";

interface JobsResponse { jobs: ApiJobView[]; nextCursor: string | null; hasMore: boolean }
interface JobResponse { job: ApiJobView }
interface OffersResponse { offers: ApiJobOfferView[]; nextCursor: string | null; hasMore: boolean }
interface OfferResponse { offer: ApiJobOfferView }
interface AcceptOfferResponse { offer: ApiJobOfferView; job: ApiJobView }

export const jobsApi = {
  getCategories: async (): Promise<ServiceCategory[]> => {
    const response = await apiClient.get<{ categories: ServiceCategory[] }>(API_ENDPOINTS.CATEGORIES.LIST, { skipAuth: true });
    return response.categories;
  },
  getSkills: async (categoryId: string): Promise<ServiceSkill[]> => {
    const response = await apiClient.get<{ skills: ServiceSkill[] }>(API_ENDPOINTS.CATEGORIES.SKILLS(categoryId), { skipAuth: true });
    return response.skills;
  },
  getJobs: async (params?: { status?: string }): Promise<Job[]> => {
    const response = await apiClient.get<JobsResponse>(API_ENDPOINTS.JOBS.LIST, { params });
    return response.jobs.map(mapApiJobToView);
  },
  getJobById: async (id: string): Promise<Job> => {
    const response = await apiClient.get<JobResponse>(API_ENDPOINTS.JOBS.DETAIL(id));
    return mapApiJobToView(response.job);
  },
  createJob: async (request: CreateJobApiRequest): Promise<Job> => {
    const response = await apiClient.post<JobResponse>(API_ENDPOINTS.JOBS.CREATE, request);
    return mapApiJobToView(response.job);
  },
  cancelJob: async (id: string, reason: string): Promise<Job> => {
    const response = await apiClient.post<JobResponse>(API_ENDPOINTS.JOBS.CANCEL(id), { reason });
    return mapApiJobToView(response.job);
  },
  getJobMatchingStatus: async (jobId: string): Promise<Job> => jobsApi.getJobById(jobId),
  getWorkerOffers: async (): Promise<JobOffer[]> => {
    const response = await apiClient.get<OffersResponse>(API_ENDPOINTS.OFFERS.LIST);
    return response.offers.map(mapApiOfferToView);
  },
  getOfferById: async (offerId: string): Promise<JobOffer> => {
    const response = await apiClient.get<OfferResponse>(API_ENDPOINTS.OFFERS.DETAIL(offerId));
    return mapApiOfferToView(response.offer);
  },
  acceptOffer: async (offerId: string): Promise<{ offer: JobOffer; job: Job }> => {
    const response = await apiClient.post<AcceptOfferResponse>(API_ENDPOINTS.OFFERS.ACCEPT(offerId), {});
    return { offer: mapApiOfferToView(response.offer), job: mapApiJobToView(response.job) };
  },
  declineOffer: async (offerId: string, reason?: string): Promise<JobOffer> => {
    const response = await apiClient.post<OfferResponse>(API_ENDPOINTS.OFFERS.DECLINE(offerId), { reason });
    return mapApiOfferToView(response.offer);
  },
  advanceJobState: async (jobId: string, action: "start-travel" | "arrive" | "start" | "complete"): Promise<Job> => {
    const endpoint = action === "start-travel" ? API_ENDPOINTS.JOBS.START_TRAVEL(jobId) : action === "arrive" ? API_ENDPOINTS.JOBS.ARRIVE(jobId) : action === "start" ? API_ENDPOINTS.JOBS.START(jobId) : API_ENDPOINTS.JOBS.COMPLETE(jobId);
    const response = await apiClient.post<JobResponse>(endpoint, {});
    return mapApiJobToView(response.job);
  },
};
