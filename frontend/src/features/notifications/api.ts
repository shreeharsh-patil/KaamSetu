import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AppNotification } from "./types";

export const notificationsApi = {
  getNotifications: async (): Promise<AppNotification[]> => {
    const res = await apiClient.get<{ notifications: AppNotification[] } | AppNotification[]>(
      API_ENDPOINTS.NOTIFICATIONS.LIST
    );
    if (Array.isArray(res)) return res;
    return res.notifications ?? [];
  },

  /** Unread badge count for nav (client-side; backend has no count endpoint). */
  countUnread: async (): Promise<number> => {
    const notifications = await notificationsApi.getNotifications();
    return notifications.filter((n) => !n.read).length;
  },

  markAsRead: async (id: string): Promise<{ success: boolean }> => {
    return apiClient.patch<{ success: boolean }>(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {});
  },

  markAllAsRead: async (): Promise<{ success: boolean }> => {
    return apiClient.post<{ success: boolean }>(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {});
  },
};
