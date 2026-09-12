"use client";

import { useQuery } from "@tanstack/react-query";
import { notificationsApi } from "./api";
import { useAuth } from "@/features/auth/use-auth";

/**
 * Unread notification count for top-bar/sidebar badges.
 * Real data only — 0 hides the badge. Cheap cached query with modest polling.
 */
export function useNotifications() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => notificationsApi.countUnread(),
    enabled: isAuthenticated,
    staleTime: 10_000,
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
    retry: 1,
  });
}
