"use client";

import { useQuery } from "@tanstack/react-query";
import { messagingApi } from "./api";
import { useAuth } from "@/features/auth/use-auth";

/**
 * Unread message count for nav badges, derived from real conversation summaries.
 * Returns 0 (no badge) when there is nothing unread — never a fake count.
 * Leverages the shared ["conversations"] query key so any invalidation
 * (such as markAsRead or realtime message arrival) immediately updates the badge.
 */
export function useUnreadConversations() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagingApi.getConversations(),
    select: (conversations) =>
      conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    enabled: isAuthenticated,
    staleTime: 10_000,
  });
}
