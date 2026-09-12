import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { User } from "@/features/auth/types";
import type { ServiceCategory, ServiceSkill } from "@/features/jobs/types";
import type { WorkerEnrollmentRequest, WorkerProfile } from "./types";

export const workersApi = {
  categories: async (): Promise<ServiceCategory[]> => {
    const response = await apiClient.get<{ categories: ServiceCategory[] }>(API_ENDPOINTS.CATEGORIES.LIST, { skipAuth: true });
    return response.categories;
  },
  skills: async (categoryId: string): Promise<ServiceSkill[]> => {
    const response = await apiClient.get<{ skills: ServiceSkill[] }>(API_ENDPOINTS.CATEGORIES.SKILLS(categoryId), { skipAuth: true });
    return response.skills;
  },
  enroll: (request: WorkerEnrollmentRequest) => apiClient.post<{ user: User; profile: WorkerProfile }>(API_ENDPOINTS.WORKERS.ENROLL, request),
  me: () => apiClient.get<WorkerProfile>(API_ENDPOINTS.WORKERS.ME),
  updateAvailability: (availabilityStatus: WorkerProfile["availabilityStatus"]) => apiClient.put<WorkerProfile>(API_ENDPOINTS.WORKERS.AVAILABILITY, { availabilityStatus }),
};
