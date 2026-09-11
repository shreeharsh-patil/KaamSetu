import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  AdminStats,
  AdminUser,
  AdminWorker,
  AdminJob,
  AdminVerificationRequest,
  AdminDispute,
  AdminAuditLog,
} from "./types";

export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    return apiClient.get<AdminStats>(API_ENDPOINTS.ADMIN.STATS);
  },

  getUsers: async (search?: string, role?: string): Promise<AdminUser[]> => {
    const q = new URLSearchParams();
    if (search) q.append("search", search);
    if (role) q.append("role", role);
    const url = `${API_ENDPOINTS.ADMIN.USERS}${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await apiClient.get<{ users: AdminUser[] } | AdminUser[]>(url);
    if (Array.isArray(res)) return res;
    return res.users ?? [];
  },

  setUserSuspension: async (
    userId: string,
    suspended: boolean,
    reason?: string
  ): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/suspension`,
      { suspended, reason }
    );
  },

  getWorkers: async (status?: string): Promise<AdminWorker[]> => {
    const q = new URLSearchParams();
    if (status) q.append("status", status);
    const url = `${API_ENDPOINTS.ADMIN.WORKERS}${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await apiClient.get<{ workers: AdminWorker[] } | AdminWorker[]>(url);
    if (Array.isArray(res)) return res;
    return res.workers ?? [];
  },

  getJobs: async (status?: string): Promise<AdminJob[]> => {
    const q = new URLSearchParams();
    if (status) q.append("status", status);
    const url = `${API_ENDPOINTS.ADMIN.JOBS}${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await apiClient.get<{ jobs: AdminJob[] } | AdminJob[]>(url);
    if (Array.isArray(res)) return res;
    return res.jobs ?? [];
  },

  getVerifications: async (): Promise<AdminVerificationRequest[]> => {
    const res = await apiClient.get<
      { verifications: AdminVerificationRequest[] } | AdminVerificationRequest[]
    >(API_ENDPOINTS.ADMIN.VERIFICATIONS);
    if (Array.isArray(res)) return res;
    return res.verifications ?? [];
  },

  reviewVerification: async (
    verificationId: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.VERIFICATIONS}/${verificationId}/review`,
      { status, rejectionReason }
    );
  },

  getDisputes: async (): Promise<AdminDispute[]> => {
    const res = await apiClient.get<{ disputes: AdminDispute[] } | AdminDispute[]>(
      API_ENDPOINTS.ADMIN.DISPUTES
    );
    if (Array.isArray(res)) return res;
    return res.disputes ?? [];
  },

  resolveDispute: async (
    disputeId: string,
    resolution: "REFUND_CUSTOMER" | "RELEASE_TO_WORKER" | "SPLIT",
    notes: string
  ): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.DISPUTES}/${disputeId}/resolve`,
      { resolution, notes }
    );
  },

  getAuditLogs: async (): Promise<AdminAuditLog[]> => {
    const res = await apiClient.get<{ logs: AdminAuditLog[] } | AdminAuditLog[]>(
      API_ENDPOINTS.ADMIN.AUDIT_LOGS
    );
    if (Array.isArray(res)) return res;
    return res.logs ?? [];
  },
};
