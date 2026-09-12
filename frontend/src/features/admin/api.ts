import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import { paiseToRupees } from "@/lib/money/format-money";
import type {
  AdminStats,
  AdminUser,
  AdminWorker,
  AdminJob,
  AdminVerificationRequest,
  AdminDispute,
  AdminAuditLog,
  ResolveDisputePayload,
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
    const res = await apiClient.get<{ items: Array<Record<string, unknown>> }>(url);
    const items = res?.items ?? [];
    return items.map((u) => {
      const phone = String(u.phoneNumber ?? u.phone ?? "");
      return {
        id: String(u.id ?? u._id ?? ""),
        phoneNumber: phone,
        phone,
        name: u.name ? String(u.name) : `User ${phone ? phone.slice(-4) : "Account"}`,
        role: (u.role as AdminUser["role"]) || "CUSTOMER",
        status: (u.status as AdminUser["status"]) || "ACTIVE",
        createdAt: String(u.createdAt ?? new Date().toISOString()),
      };
    });
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

  getWorkers: async (
    options?: { verificationStatus?: string; availabilityStatus?: string } | string
  ): Promise<AdminWorker[]> => {
    let verificationStatus: string | undefined;
    let availabilityStatus: string | undefined;

    if (typeof options === "string") {
      verificationStatus = options === "APPROVED" ? "VERIFIED" : options || undefined;
    } else if (options) {
      verificationStatus = options.verificationStatus === "APPROVED" ? "VERIFIED" : options.verificationStatus;
      availabilityStatus = options.availabilityStatus;
    }

    const q = new URLSearchParams();
    if (verificationStatus) q.append("verificationStatus", verificationStatus);
    if (availabilityStatus) q.append("availabilityStatus", availabilityStatus);

    const url = `${API_ENDPOINTS.ADMIN.WORKERS}${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await apiClient.get<{ items: Array<Record<string, unknown>> }>(url);
    const items = res?.items ?? [];
    return items.map((w) => ({
      id: String(w.id ?? w._id ?? ""),
      userId: String(w.userId ?? ""),
      name: String(w.displayName ?? w.name ?? "Registered Worker"),
      phone: w.phone ? String(w.phone) : undefined,
      category: w.category ? String(w.category) : undefined,
      skills: Array.isArray(w.skills) ? w.skills.map(String) : [],
      verificationStatus: (w.verificationStatus as AdminWorker["verificationStatus"]) || "UNVERIFIED",
      availabilityStatus: (w.availabilityStatus as AdminWorker["availabilityStatus"]) || "OFFLINE",
      isSuspended: Boolean(w.isSuspended),
      locality: w.serviceLocation && typeof w.serviceLocation === "object" ? "Active Area" : undefined,
      createdAt: String(w.createdAt ?? new Date().toISOString()),
    }));
  },

  getJobs: async (status?: string): Promise<AdminJob[]> => {
    const q = new URLSearchParams();
    if (status) q.append("status", status);
    const url = `${API_ENDPOINTS.ADMIN.JOBS}${q.toString() ? `?${q.toString()}` : ""}`;
    const res = await apiClient.get<{ items: AdminJob[] }>(url);
    return res.items ?? [];
  },

  getVerifications: async (): Promise<AdminVerificationRequest[]> => {
    const res = await apiClient.get<
      { items: AdminVerificationRequest[] }
    >(API_ENDPOINTS.ADMIN.VERIFICATIONS);
    return res.items ?? [];
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
    const res = await apiClient.get<{ items: Array<Record<string, unknown>> }>(
      API_ENDPOINTS.ADMIN.DISPUTES
    );
    const items = res?.items ?? [];
    return items.map((d) => ({
      id: String(d.id ?? d._id ?? ""),
      jobId: String(d.jobId ?? ""),
      jobTitle: String(d.jobTitle ?? `Job #${String(d.jobId ?? "").slice(-6)}`),
      initiatorRole: (d.initiatorRole as AdminDispute["initiatorRole"]) || "CUSTOMER",
      initiatorName: String(d.initiatorName ?? "Customer"),
      respondentName: String(d.respondentName ?? "Worker"),
      amount: paiseToRupees(Number(d.amount ?? d.disputedAmountPaise ?? 0)),
      reason: String(d.reason ?? ""),
      status: (d.status as AdminDispute["status"]) || "OPEN",
      createdAt: String(d.createdAt ?? new Date().toISOString()),
    }));
  },

  resolveDispute: async (
    disputeId: string,
    payload: ResolveDisputePayload
  ): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>(
      API_ENDPOINTS.ADMIN.RESOLVE_DISPUTE(disputeId),
      payload
    );
  },

  getAuditLogs: async (): Promise<AdminAuditLog[]> => {
    const res = await apiClient.get<{ items: AdminAuditLog[] }>(
      API_ENDPOINTS.ADMIN.AUDIT_LOGS
    );
    return res.items ?? [];
  },
};
