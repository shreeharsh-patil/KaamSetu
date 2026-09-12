"use client";

import { useQuery } from "@tanstack/react-query";
import { messagingApi } from "./api";
import { useAuth } from "@/features/auth/use-auth";

/**
 * Unread message count for nav badges, derived from real conversation data.
 * Returns 0 (no badge) when there is nothing unread — never a fake count.
 * Uses a modest interval instead of socket wiring so it works on every page
 * without duplicating the chat page's socket cache sync.
 */
export function useUnreadConversations() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["conversations", "unread-count"],
    queryFn: async (): Promise<number> => {
      const conversations = await messagingApi.getConversations();
      return conversations.reduce(
        (sum, c) => sum + (c.unreadCount > 0 ? 1 : 0),
        0
      );
    },
    enabled: isAuthenticated,
    staleTime: 10_000,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}
