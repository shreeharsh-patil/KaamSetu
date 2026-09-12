"use client";

import { use, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Send,
  MapPin,
  Phone,
  CheckCheck,
  Check,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { messagingApi } from "@/features/messaging/api";
import { useAuth } from "@/features/auth/auth-context";

export default function ChatConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [inputText, setInputText] = useState("");
  const [isSendingLocation, setIsSendingLocation] = useState(false);

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagingApi.getMessages(conversationId),
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: (payload: { content: string; type?: string; mediaUrl?: string }) =>
      messagingApi.sendMessage(conversationId, payload),
    onSuccess: () => {
      setInputText("");
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sendMutation.isPending) return;
    sendMutation.mutate({
      content: inputText.trim(),
      type: "TEXT",
    });
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation) return;
    setIsSendingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        sendMutation.mutate({
          content: `Shared current location: https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}`,
          type: "LOCATION",
        });
        setIsSendingLocation(false);
      },
      () => {
        setIsSendingLocation(false);
      }
    );
  };

  const currentUserId = user?.id;

  return (
    <Container className="py-4 max-w-2xl flex flex-col h-[calc(100vh-80px)]">
      {/* Chat Top Bar */}
      <div className="flex items-center justify-between pb-3 border-b shrink-0">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/messages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex items-center gap-2.5">
            <Avatar className="h-9 w-9 border">
              <AvatarImage src="" />
              <AvatarFallback className="font-semibold text-xs">KS</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-sm font-bold text-foreground leading-none">Job Chat</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Reference #{conversationId.slice(-8)}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <a href="tel:9876543210" aria-label="Call">
              <Phone className="h-4 w-4 text-foreground" />
            </a>
          </Button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-destructive text-sm flex items-center justify-center gap-2">
            <AlertCircle className="h-4 w-4" /> Failed to load messages.
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-xs space-y-1">
            <p className="font-semibold text-foreground">No messages yet</p>
            <p>Send a message or coordinate arrival directions below.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender.id === currentUserId || msg.sender.role === user?.role?.toLowerCase();
            const isSystem = msg.type === "SYSTEM" || msg.sender.role === "system";

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-[11px] bg-muted/60 text-muted-foreground px-3 py-1 rounded-full border">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-xs ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-xs"
                      : "bg-muted text-foreground border rounded-tl-xs"
                  }`}
                >
                  {msg.type === "LOCATION" ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 shrink-0 text-amber-400" />
                      <a
                        href={msg.content.replace("Shared current location: ", "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-xs"
                      >
                        View Shared Pin on Maps
                      </a>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {isMe && (
                      msg.status === "READ" ? (
                        <CheckCheck className="h-3 w-3 text-blue-300" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSend} className="pt-2 border-t flex items-center gap-2 shrink-0">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleShareLocation}
          disabled={isSendingLocation || sendMutation.isPending}
          title="Share Location"
        >
          {isSendingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>

        <Input
          placeholder="Type your message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          disabled={sendMutation.isPending}
          className="flex-1"
        />

        <Button type="submit" disabled={!inputText.trim() || sendMutation.isPending} size="icon">
          {sendMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </Container>
  );
}
