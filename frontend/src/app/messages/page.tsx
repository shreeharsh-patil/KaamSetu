"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, ImageIcon, MapPin } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { messagingApi } from "@/features/messaging/api";
import { getSocket } from "@/lib/socket/socket-client";
import type { ConversationSummary } from "@/features/messaging/types";

function formatConversationTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return "Yesterday";
    }

    return date.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

function renderMessagePreview(conv: ConversationSummary) {
  if (!conv.lastMessage) {
    return <span className="text-muted-foreground/60 italic">No messages yet</span>;
  }

  if (conv.lastMessage.type === "IMAGE") {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <ImageIcon className="h-3.5 w-3.5 shrink-0 text-primary" /> Photo
      </span>
    );
  }

  if (conv.lastMessage.type === "LOCATION") {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-emerald-600" /> Location shared
      </span>
    );
  }

  return <span className="text-muted-foreground truncate">{conv.lastMessage.content}</span>;
}

export default function MessagesListPage() {
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    const socket = getSocket();
    setSocketConnected(socket.connected);

    const onConnect = () => setSocketConnected(true);
    const onDisconnect = () => setSocketConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  const { data: rawConversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagingApi.getConversations(),
    staleTime: 30_000,
    // When Socket.IO is connected and receiving realtime invalidations, disable aggressive interval polling.
    // Fallback to 15s interval only if disconnected.
    refetchInterval: socketConnected ? false : 15_000,
  });

  // Sort by most recent activity
  const conversations = useMemo(() => {
    return [...rawConversations].sort((a, b) => {
      const timeA = new Date(a.lastMessageAt || a.updatedAt).getTime();
      const timeB = new Date(b.lastMessageAt || b.updatedAt).getTime();
      return timeB - timeA;
    });
  }, [rawConversations]);

  return (
    <Container className="py-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" aria-hidden="true" />
          Messages
        </h1>
        <p className="text-sm text-muted-foreground">
          Active conversations with customers and service professionals
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Loading conversations">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed text-muted-foreground space-y-3">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30" aria-hidden="true" />
          <h3 className="font-semibold text-foreground">No conversations yet</h3>
          <p className="text-xs max-w-sm mx-auto">
            When a job request is accepted, real-time messaging with your customer or worker will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2" role="feed" aria-label="Conversations list">
          {conversations.map((conv) => {
            const lastActiveDate =
              conv.lastMessage?.createdAt || conv.lastMessageAt || conv.updatedAt;
            const timeLabel = formatConversationTime(lastActiveDate);

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors gap-3 group focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-11 w-11 border shrink-0">
                    <AvatarImage
                      src={conv.otherParticipant.avatarUrl ?? undefined}
                      alt={conv.otherParticipant.name}
                    />
                    <AvatarFallback className="font-semibold text-xs">
                      {(conv.otherParticipant.name || "U").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-semibold text-sm text-foreground truncate">
                        {conv.otherParticipant.name}
                      </h2>
                      {timeLabel && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {timeLabel}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-primary font-medium truncate">
                      {conv.jobTitle}
                    </p>

                    <div className="text-xs truncate">{renderMessagePreview(conv)}</div>
                  </div>
                </div>

                {conv.unreadCount > 0 && (
                  <Badge
                    className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 shrink-0 font-semibold"
                    aria-label={`${conv.unreadCount} unread messages`}
                  >
                    {conv.unreadCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
