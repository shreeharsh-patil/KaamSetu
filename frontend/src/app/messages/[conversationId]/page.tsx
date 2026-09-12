"use client";

import { use, useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  ArrowLeft,
  Send,
  MapPin,
  ImageIcon,
  CheckCheck,
  Check,
  Clock,
  Loader2,
  AlertCircle,
  ExternalLink,
  X,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { messagingApi } from "@/features/messaging/api";
import { useAuth } from "@/features/auth/auth-context";
import { getSocket, connectSocket } from "@/lib/socket/socket-client";
import { uploadsApi, putPresignedFile } from "@/features/uploads/api";
import type {
  ApiMessage,
  MessageViewModel,
  MessageType,
  MessageAttachment,
  MessagesPageResponse,
} from "@/features/messaging/types";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export default function ChatConversationPage({
  params,
  searchParams,
}: {
  params: Promise<{ conversationId: string }>;
  searchParams: Promise<{ job?: string }>;
}) {
  const { conversationId: routeId } = use(params);
  const { job: jobParam } = use(searchParams);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputText, setInputText] = useState("");
  const [isSendingLocation, setIsSendingLocation] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);

  // In-flight / failed optimistic messages
  const [optimisticMessages, setOptimisticMessages] = useState<MessageViewModel[]>([]);

  // Track socket connection state
  useEffect(() => {
    const socket = getSocket();
    connectSocket();
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

  // Resolve the effective conversation id
  const {
    data: resolvedId,
    error: resolveError,
    isLoading: isResolving,
  } = useQuery({
    queryKey: ["conversation-resolve", jobParam ?? routeId],
    queryFn: async () => {
      if (jobParam) {
        return messagingApi.resolveConversationForJob(jobParam);
      }
      try {
        const conv = await messagingApi.getConversation(routeId);
        return conv.id;
      } catch {
        // Fallback: if routeId was actually a jobId
        return messagingApi.resolveConversationForJob(routeId);
      }
    },
    staleTime: 60 * 1000,
  });

  // Fetch conversation summary for header details
  const { data: conversationData } = useQuery({
    queryKey: ["conversation-summary", resolvedId],
    queryFn: () => messagingApi.getConversation(resolvedId!),
    enabled: Boolean(resolvedId),
    staleTime: 30 * 1000,
  });

  // Infinite query for cursor-paginated messages
  const {
    data: messagesPages,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useInfiniteQuery<
    MessagesPageResponse,
    Error,
    InfiniteData<MessagesPageResponse, string | undefined>,
    [string, string | undefined],
    string | undefined
  >({
    queryKey: ["messages", resolvedId],
    queryFn: ({ pageParam }) =>
      messagingApi.getMessages(resolvedId!, pageParam, 20),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore && lastPage.nextCursor ? lastPage.nextCursor : undefined,
    enabled: Boolean(resolvedId),
    staleTime: 10_000,
    // Disable aggressive polling when Socket.IO is connected and operational
    refetchInterval: socketConnected ? false : 5_000,
  });

  // Mark conversation as read on entry and when new messages arrive
  const markConversationRead = useCallback(() => {
    if (!resolvedId) return;
    messagingApi
      .markAsRead(resolvedId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
      })
      .catch(() => {});
  }, [resolvedId, queryClient]);

  useEffect(() => {
    const firstPage = messagesPages?.pages?.[0];
    if (resolvedId && firstPage && firstPage.messages.length > 0) {
      markConversationRead();
    }
  }, [resolvedId, messagesPages?.pages, markConversationRead]);

  // Realtime Socket.IO room management and event listeners
  useEffect(() => {
    if (!resolvedId) return;
    const socket = getSocket();
    connectSocket();

    // Join conversation room
    socket.emit("join:conversation", { conversationId: resolvedId });

    // Handle new incoming message in realtime
    const handleNewMessage = (payload: { conversationId: string; message: ApiMessage }) => {
      if (payload.conversationId === resolvedId && payload.message) {
        const newMsg = payload.message;

        // Remove from optimistic queue if this server message matches a local temp message
        setOptimisticMessages((prev) =>
          prev.filter((m) => {
            if (m.type === newMsg.type && m.content === newMsg.content) {
              return false;
            }
            return true;
          })
        );

        // Update infinite query data in cache
        queryClient.setQueryData<InfiniteData<MessagesPageResponse, string | undefined>>(
          ["messages", resolvedId],
          (oldData) => {
            if (!oldData || !oldData.pages.length) {
              return {
                pages: [{ messages: [newMsg], nextCursor: null, hasMore: false }],
                pageParams: [undefined],
              };
            }

            // Check for duplicates across all pages
            const exists = oldData.pages.some((page) =>
              page.messages.some((m) => m.id === newMsg.id)
            );
            if (exists) {
              return oldData;
            }

            // Append to the first page (newest messages page)
            const first = oldData.pages[0];
            const updatedFirstPage: MessagesPageResponse = {
              messages: [newMsg, ...(first ? first.messages : [])],
              nextCursor: first ? first.nextCursor : null,
              hasMore: first ? first.hasMore : false,
            };

            return {
              ...oldData,
              pages: [updatedFirstPage, ...oldData.pages.slice(1)],
            };
          }
        );

        // If the message is from another participant, mark read immediately
        if (newMsg.senderId !== user?.id && newMsg.sender?.id !== user?.id) {
          markConversationRead();
        }
      }
    };

    // Handle read receipt
    const handleMessageRead = (payload: {
      conversationId: string;
      readerId: string;
      readAt: string;
    }) => {
      if (payload.conversationId === resolvedId) {
        queryClient.setQueryData<InfiniteData<MessagesPageResponse, string | undefined>>(
          ["messages", resolvedId],
          (oldData) => {
            if (!oldData) return oldData;
            return {
              ...oldData,
              pages: oldData.pages.map((page) => ({
                ...page,
                messages: page.messages.map((m) => {
                  // If message was sent by current user and is not yet marked read
                  if (
                    (m.senderId === user?.id || m.sender?.id === user?.id) &&
                    !m.readAt
                  ) {
                    return { ...m, readAt: payload.readAt };
                  }
                  return m;
                }),
              })),
            };
          }
        );
      }
    };

    socket.on("message.created", handleNewMessage);
    socket.on("message.read", handleMessageRead);

    return () => {
      socket.emit("leave:conversation", { conversationId: resolvedId });
      socket.off("message.created", handleNewMessage);
      socket.off("message.read", handleMessageRead);
    };
  }, [resolvedId, user?.id, queryClient, markConversationRead]);

  // Combine, deduplicate, and sort all messages in chronological order (oldest to newest)
  const displayMessages = useMemo(() => {
    const serverMsgs = messagesPages?.pages.flatMap((page) => page.messages) ?? [];
    const map = new Map<string, MessageViewModel>();

    // Add server messages
    for (const msg of serverMsgs) {
      map.set(msg.id, {
        ...msg,
        deliveryStatus: msg.readAt ? "READ" : "SENT",
      });
    }

    // Overlay in-flight or failed optimistic messages
    for (const opt of optimisticMessages) {
      // Don't display optimistic message if an identical server message has already arrived
      const alreadyConfirmed = serverMsgs.some(
        (sm) => sm.content === opt.content && sm.type === opt.type
      );
      if (!alreadyConfirmed) {
        map.set(opt.tempId || opt.id, opt);
      }
    }

    // Sort strictly chronological: oldest at top, newest at bottom
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messagesPages, optimisticMessages]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [displayMessages.length, scrollToBottom]);

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: (payload: {
      content: string;
      type: MessageType;
      attachment?: MessageAttachment;
      tempId: string;
    }) =>
      messagingApi.sendMessage(resolvedId!, {
        content: payload.content,
        type: payload.type,
        attachment: payload.attachment,
      }),
    onSuccess: (serverMsg, variables) => {
      // Remove temporary optimistic message
      setOptimisticMessages((prev) => prev.filter((m) => m.tempId !== variables.tempId));

      // Append server message to cache
      queryClient.setQueryData<InfiniteData<MessagesPageResponse, string | undefined>>(
        ["messages", resolvedId],
        (oldData) => {
          if (!oldData || !oldData.pages.length) {
            return {
              pages: [{ messages: [serverMsg], nextCursor: null, hasMore: false }],
              pageParams: [undefined],
            };
          }
          const exists = oldData.pages.some((page) =>
            page.messages.some((m) => m.id === serverMsg.id)
          );
          if (exists) return oldData;

          const first = oldData.pages[0];
          const updatedFirstPage: MessagesPageResponse = {
            messages: [serverMsg, ...(first ? first.messages : [])],
            nextCursor: first ? first.nextCursor : null,
            hasMore: first ? first.hasMore : false,
          };

          return {
            ...oldData,
            pages: [updatedFirstPage, ...oldData.pages.slice(1)],
          };
        }
      );

      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (_err, variables) => {
      // Mark temporary message as failed
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.tempId === variables.tempId
            ? { ...m, deliveryStatus: "FAILED" }
            : m
        )
      );
    },
  });

  const sendWithOptimism = useCallback(
    (payload: {
      content: string;
      type: MessageType;
      attachment?: MessageAttachment;
    }) => {
      if (!resolvedId || !user) return;
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const tempMessage: MessageViewModel = {
        id: tempId,
        tempId,
        conversationId: resolvedId,
        sender: {
          id: user.id,
          displayName: user.fullName || (user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : "You"),
          role: user.role,
          avatarUrl: user.profilePhotoUrl ?? null,
        },
        senderId: user.id,
        type: payload.type,
        content: payload.content,
        attachment: payload.attachment,
        readAt: null,
        createdAt: new Date().toISOString(),
        deliveryStatus: "SENDING",
        failedPayload: payload,
      };

      setOptimisticMessages((prev) => [...prev, tempMessage]);
      sendMutation.mutate({ ...payload, tempId });
    },
    [resolvedId, user, sendMutation]
  );

  const handleRetry = useCallback(
    (msg: MessageViewModel) => {
      if (!msg.failedPayload || !msg.tempId) return;
      setOptimisticMessages((prev) =>
        prev.map((m) =>
          m.tempId === msg.tempId ? { ...m, deliveryStatus: "SENDING" } : m
        )
      );
      sendMutation.mutate({ ...msg.failedPayload, tempId: msg.tempId });
    },
    [sendMutation]
  );

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || sendMutation.isPending || !resolvedId) return;

    sendWithOptimism({
      content: text,
      type: "TEXT",
    });
    setInputText("");
  };

  const handleShareLocation = () => {
    if (!navigator.geolocation || !resolvedId) return;
    setIsSendingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // GeoJSON convention: [longitude, latitude]
        const lng = pos.coords.longitude;
        const lat = pos.coords.latitude;

        sendWithOptimism({
          type: "LOCATION",
          content: "Shared current location",
          attachment: {
            coordinates: [lng, lat],
          },
        });
        setIsSendingLocation(false);
      },
      () => {
        setIsSendingLocation(false);
        setUploadError("Unable to access your location. Please check browser permissions.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Only JPG, PNG, and WebP images are supported.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setUploadError("Image must be smaller than 10MB.");
      return;
    }

    setUploadError(null);
    setSelectedFile(file);
    const preview = URL.createObjectURL(file);
    setFilePreviewUrl(preview);
  };

  const cancelSelectedFile = () => {
    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setUploadProgress(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadAndSendImage = async () => {
    if (!selectedFile || !resolvedId) return;

    try {
      setUploadProgress(5);
      setUploadError(null);

      // 1. Request presigned upload
      const presigned = await uploadsApi.presign(selectedFile);
      setUploadProgress(20);

      // 2. Upload file directly to signed storage
      await putPresignedFile(selectedFile, presigned, (pct) => {
        setUploadProgress(20 + Math.round((pct * 60) / 100));
      });
      setUploadProgress(85);

      // 3. Confirm completed upload
      const completed = await uploadsApi.complete(presigned.uploadId);
      setUploadProgress(100);

      // 4. Send IMAGE message
      sendWithOptimism({
        type: "IMAGE",
        content: "Sent an image",
        attachment: {
          key: completed.key,
          url: completed.publicUrl || undefined,
          mimeType: completed.mimeType,
          sizeBytes: selectedFile.size,
        },
      });

      cancelSelectedFile();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload image";
      setUploadError(msg);
      setUploadProgress(null);
    }
  };

  const currentUserId = user?.id;
  const loading = isResolving || isLoadingMessages;
  const participant = conversationData?.otherParticipant;

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] md:h-[calc(100dvh-4.5rem)] max-w-4xl mx-auto w-full bg-background border-x border-border/40">
      {/* Header */}
      <header className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-card/60 backdrop-blur-xs shrink-0 gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Button asChild variant="ghost" size="icon" className="h-8 w-8 shrink-0">
            <Link href="/messages" aria-label="Back to messages list">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <Avatar className="h-9 w-9 border shrink-0">
            <AvatarImage
              src={participant?.avatarUrl ?? undefined}
              alt={participant?.name ?? "Participant"}
            />
            <AvatarFallback className="font-semibold text-xs bg-muted">
              {(participant?.name || "U").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-foreground leading-none truncate">
              {participant?.name || "Job Chat"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {conversationData?.jobTitle || "Job discussion"}
            </p>
          </div>
        </div>

        {conversationData?.jobId && (
          <Button asChild variant="outline" size="sm" className="h-8 text-xs shrink-0 gap-1">
            <Link href={`/jobs/${conversationData.jobId}`}>
              <Briefcase className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">View Job</span>
            </Link>
          </Button>
        )}
      </header>

      {/* Messages Feed */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 space-y-2.5 bg-muted/10"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {/* Load older messages button */}
        {hasNextPage && (
          <div className="flex justify-center pb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs h-7 px-3 bg-background/80 hover:bg-background"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                  Loading...
                </>
              ) : (
                "Load older messages"
              )}
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col justify-center items-center h-full gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-xs">Loading conversation...</span>
          </div>
        ) : resolveError || messagesError ? (
          <div className="text-center py-12 text-destructive text-xs flex flex-col items-center justify-center gap-2">
            <span className="flex items-center gap-1.5 font-medium">
              <AlertCircle className="h-4 w-4" /> Failed to load conversation.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              className="text-xs h-7"
            >
              Retry
            </Button>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground text-xs space-y-1">
            <p className="font-semibold text-foreground">No messages yet</p>
            <p>Send a message or coordinate arrival directions below.</p>
          </div>
        ) : (
          displayMessages.map((msg) => {
            // STRICT ownership: current user id only. Never check role!
            const isMe = Boolean(
              currentUserId &&
                (msg.sender?.id === currentUserId || msg.senderId === currentUserId)
            );
            const isSystem = msg.type === "SYSTEM";

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-2">
                  <span className="text-[11px] bg-muted/80 text-muted-foreground px-3 py-1 rounded-full border">
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
                  className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-xs ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-tr-xs"
                      : "bg-card text-foreground border border-border/60 rounded-tl-xs"
                  }`}
                >
                  {/* Message Content according to Type */}
                  {msg.type === "IMAGE" ? (
                    <div className="space-y-1.5">
                      {msg.attachment?.url ? (
                        <div className="rounded-lg overflow-hidden border border-black/10">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={msg.attachment.url}
                            alt={msg.content || "Shared image"}
                            className="max-h-72 max-w-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => window.open(msg.attachment?.url, "_blank")}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs py-2">
                          <ImageIcon className="h-4 w-4 shrink-0" />
                          <span>Image attachment processing...</span>
                        </div>
                      )}
                      {msg.content && msg.content !== "Sent an image" && (
                        <p className="text-xs whitespace-pre-wrap break-words">{msg.content}</p>
                      )}
                    </div>
                  ) : msg.type === "LOCATION" ? (
                    (() => {
                      const coords = msg.attachment?.coordinates;
                      const hasCoords =
                        Array.isArray(coords) &&
                        coords.length === 2 &&
                        typeof coords[0] === "number" &&
                        typeof coords[1] === "number";

                      // GeoJSON is [lng, lat]; Google Maps URL expects lat,lng
                      const mapsUrl = hasCoords
                        ? `https://maps.google.com/?q=${coords[1]},${coords[0]}`
                        : null;

                      return (
                        <div className="space-y-1.5">
                          <div className="flex items-start gap-2">
                            <MapPin className={`h-4 w-4 shrink-0 mt-0.5 ${isMe ? "text-emerald-300" : "text-emerald-600"}`} />
                            <div className="min-w-0">
                              <p className="font-semibold text-xs leading-tight">
                                {msg.attachment?.address || msg.content || "Shared Location"}
                              </p>
                              {hasCoords && (
                                <p className="text-[11px] opacity-80 mt-0.5">
                                  {coords[1].toFixed(5)}, {coords[0].toFixed(5)}
                                </p>
                              )}
                            </div>
                          </div>

                          {mapsUrl && (
                            <div className="pt-1 border-t border-current/15">
                              <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                              >
                                <span>View on Google Maps</span>
                                <ExternalLink className="h-3 w-3 shrink-0" />
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  )}

                  {/* Message Metadata & Read Indicator */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? "text-primary-foreground/75" : "text-muted-foreground"
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>

                    {isMe && (
                      <span className="inline-flex items-center ml-0.5">
                        {msg.deliveryStatus === "SENDING" ? (
                          <Clock className="h-3 w-3 animate-pulse opacity-75" aria-label="Sending" />
                        ) : msg.deliveryStatus === "FAILED" ? (
                          <span className="flex items-center gap-1 text-rose-300">
                            <AlertCircle className="h-3 w-3" />
                            <button
                              type="button"
                              onClick={() => handleRetry(msg)}
                              className="underline font-medium hover:text-white"
                            >
                              Retry
                            </button>
                          </span>
                        ) : msg.readAt || msg.deliveryStatus === "READ" ? (
                          <CheckCheck className="h-3.5 w-3.5 text-sky-300" aria-label="Read" />
                        ) : (
                          <Check className="h-3 w-3 opacity-75" aria-label="Sent" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="px-3 py-1.5 bg-destructive/10 text-destructive text-xs flex items-center justify-between border-t border-destructive/20">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            {uploadError}
          </span>
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Image Preview in Composer */}
      {filePreviewUrl && (
        <div className="px-3 py-2 border-t border-border bg-card/80 flex items-center gap-3">
          <div className="relative h-14 w-14 rounded-lg overflow-hidden border shrink-0 bg-background">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={filePreviewUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
            {uploadProgress !== null && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white font-medium">
                {uploadProgress}%
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {selectedFile?.name}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : ""}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={cancelSelectedFile}
              disabled={uploadProgress !== null}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleUploadAndSendImage}
              disabled={uploadProgress !== null}
              className="h-8 text-xs gap-1"
            >
              {uploadProgress !== null ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Send
            </Button>
          </div>
        </div>
      )}

      {/* Composer Toolbar & Input */}
      <div className="p-2 sm:p-2.5 border-t border-border bg-card shrink-0">
        <form onSubmit={handleSendText} className="flex items-center gap-1.5 sm:gap-2">
          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={ALLOWED_IMAGE_TYPES.join(",")}
            className="hidden"
            aria-label="Upload image"
          />

          {/* Photo attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={sendMutation.isPending || !resolvedId || Boolean(selectedFile)}
            className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
            title="Attach image"
            aria-label="Attach image"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>

          {/* Location button */}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleShareLocation}
            disabled={isSendingLocation || sendMutation.isPending || !resolvedId}
            className="h-9 w-9 text-muted-foreground hover:text-foreground shrink-0"
            title="Share location"
            aria-label="Share current location"
          >
            {isSendingLocation ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : (
              <MapPin className="h-4 w-4" />
            )}
          </Button>

          {/* Text Input */}
          <Input
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={sendMutation.isPending || !resolvedId}
            className="flex-1 text-sm h-9 bg-background focus-visible:ring-1"
            aria-label="Message text"
            maxLength={2000}
          />

          {/* Send button */}
          <Button
            type="submit"
            disabled={!inputText.trim() || sendMutation.isPending || !resolvedId}
            size="icon"
            className="h-9 w-9 shrink-0"
            aria-label="Send message"
          >
            {sendMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
