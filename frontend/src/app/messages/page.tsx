"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { messagingApi } from "@/features/messaging/api";

export default function MessagesListPage() {
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagingApi.getConversations(),
    refetchInterval: 5000,
  });

  return (
    <Container className="py-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <MessageSquare className="h-6 w-6 text-primary" />
          Messages
        </h1>
        <p className="text-sm text-muted-foreground">
          Active conversations with customers and service professionals
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse border" />
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-dashed text-muted-foreground space-y-3">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/30" />
          <h3 className="font-semibold text-foreground">No conversations yet</h3>
          <p className="text-xs max-w-sm mx-auto">
            When a job request is accepted, real-time messaging with your customer or worker will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/40 transition-colors gap-3"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="h-11 w-11 border shrink-0">
                  <AvatarImage src={conv.otherParticipant.avatarUrl} />
                  <AvatarFallback className="font-semibold text-xs">
                    {conv.otherParticipant.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-foreground truncate">
                      {conv.otherParticipant.name}
                    </h3>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {new Date(conv.updatedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-primary font-medium truncate">
                    Job: {conv.jobTitle}
                  </p>
                  {conv.lastMessage && (
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>

              {conv.unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 shrink-0">
                  {conv.unreadCount}
                </Badge>
              )}
            </Link>
          ))}
        </div>
      )}
    </Container>
  );
}
