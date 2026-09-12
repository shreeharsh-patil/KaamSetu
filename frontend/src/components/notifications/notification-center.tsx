"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  Briefcase,
  MessageSquare,
  IndianRupee,
  Info,
  Clock,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { notificationsApi } from "@/features/notifications/api";
import type { AppNotification } from "@/features/notifications/types";
import { cn } from "@/lib/utils";

export function NotificationCenter({ className }: { className?: string }) {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.getNotifications(),
    refetchInterval: 10000,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "JOB_OFFER":
      case "JOB_STATUS":
        return <Briefcase className="h-4 w-4 text-primary" />;
      case "MESSAGE":
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case "PAYMENT":
        return <IndianRupee className="h-4 w-4 text-emerald-500" />;
      default:
        return <Info className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className={cn("w-full shadow-md border", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-bold">Notifications</CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5">
              {unreadCount}
            </Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="text-xs text-muted-foreground hover:text-foreground h-8"
          >
            <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-2 p-4 pt-0 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/40 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-xs space-y-1">
            <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="font-semibold text-foreground">All caught up!</p>
            <p>No new notifications at this time.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.read) markReadMutation.mutate(n.id);
              }}
              className={cn(
                "p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer",
                !n.read
                  ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  : "bg-card border-border hover:bg-muted/40"
              )}
            >
              <div className="p-2 rounded-full bg-background border shrink-0 mt-0.5">
                {getIcon(n.type)}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={cn("text-xs font-semibold", !n.read ? "text-primary" : "text-foreground")}>
                    {n.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                {n.link && (
                  <Link
                    href={n.link}
                    className="text-[11px] font-semibold text-primary hover:underline inline-block mt-1"
                  >
                    View details →
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
