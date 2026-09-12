import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { AppNotification } from "./types";

interface BackendNotification {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt?: string | null;
  createdAt: string;
  link?: string;
  read?: boolean;
}

export const notificationsApi = {
  getNotifications: async (): Promise<AppNotification[]> => {
    const res = await apiClient.get<{ notifications: BackendNotification[] } | BackendNotification[]>(
      API_ENDPOINTS.NOTIFICATIONS.LIST
    );
    const raw = Array.isArray(res) ? res : res.notifications ?? [];

    return raw.map((n) => {
      let link = n.link;
      if (!link && n.data) {
        if (n.data["conversationId"]) {
          link = `/messages/${n.data["conversationId"]}`;
        } else if (n.data["jobId"]) {
          link = `/jobs/${n.data["jobId"]}`;
        }
      }

      return {
        id: n.id,
        title: n.title,
        body: n.body,
        type: n.type as AppNotification["type"],
        read: Boolean(n.readAt || n.read),
        link,
        createdAt: n.createdAt,
      };
    });
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
