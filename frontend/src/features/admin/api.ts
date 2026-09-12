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
    const res = await apiClient.get<{ items: AdminUser[] }>(url);
    return res.items;
  },

  setUserSuspension: async (
    userId: string,
    suspended: boolean,
    reason?: string
  ): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.USERS}/${userId}/${suspended ? "suspend" : "restore"}`,
      reason ? { reason } : {}
    );
  },

  getWorkers: async (status?: string): Promise<AdminWorker[]> => {
    const q = new URLSearchParams();
    if (status) q.append("status", status);
    const url = `${API_ENDPOINTS.ADMIN.WORKERS}${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await apiClient.get<{ items: AdminWorker[] }>(url);
    return res.items;
  },

  getJobs: async (status?: string): Promise<AdminJob[]> => {
    const q = new URLSearchParams();
    if (status) q.append("status", status);
    const url = `${API_ENDPOINTS.ADMIN.JOBS}${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await apiClient.get<{ items: AdminJob[] }>(url);
    return res.items;
  },

  getVerifications: async (): Promise<AdminVerificationRequest[]> => {
    const res = await apiClient.get<
      { items: AdminVerificationRequest[] }
    >(API_ENDPOINTS.ADMIN.VERIFICATIONS);
    return res.items;
  },

  reviewVerification: async (
    verificationId: string,
    status: "APPROVED" | "REJECTED",
    rejectionReason?: string
  ): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>(
      `${API_ENDPOINTS.ADMIN.VERIFICATIONS}/${verificationId}/review`,
      { status, reason: rejectionReason }
    );
  },

  getDisputes: async (): Promise<AdminDispute[]> => {
    const res = await apiClient.get<{ items: AdminDispute[] }>(
      API_ENDPOINTS.ADMIN.DISPUTES
    );
    return res.items;
  },

  resolveDispute: async (
    disputeId: string,
    resolution: "REFUND_CUSTOMER" | "RELEASE_TO_WORKER" | "SPLIT",
    notes: string
  ): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>(
      API_ENDPOINTS.ADMIN.RESOLVE_DISPUTE(disputeId),
      { resolution, resolutionNotes: notes }
    );
  },

  getAuditLogs: async (): Promise<AdminAuditLog[]> => {
    const res = await apiClient.get<{ items: AdminAuditLog[] }>(
      API_ENDPOINTS.ADMIN.AUDIT_LOGS
    );
    return res.items;
  },
};
