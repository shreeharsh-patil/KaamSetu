import { io, Socket } from "socket.io-client";
import { env } from "@/config/env";
import { getAccessToken } from "@/lib/api/client";
import type { QueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/api/query-keys";

let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
  const socketUrl = env.NEXT_PUBLIC_SOCKET_URL;

    socketInstance = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      transports: ["websocket", "polling"],
      auth: (cb) => {
        const token = getAccessToken();
        cb({ token: token ? `Bearer ${token}` : undefined });
      },
    });

    let hasWarnedSocket = false;

    socketInstance.on("connect", () => {
      hasWarnedSocket = false;
      if (process.env.NODE_ENV !== "production") {
        console.info("[Socket] Connected:", socketInstance?.id);
      }
    });

    socketInstance.on("disconnect", (reason) => {
      if (process.env.NODE_ENV !== "production") {
        console.info("[Socket] Disconnected:", reason);
      }
    });

    socketInstance.on("connect_error", (error) => {
      if (process.env.NODE_ENV !== "production" && !hasWarnedSocket) {
        console.info("[Socket] Backend server unreachable (running in offline/mock mode):", error.message);
        hasWarnedSocket = true;
      }
    });
  }

  return socketInstance;
}

export function connectSocket(): void {
  const socket = getSocket();
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

/**
 * Attaches central query invalidators to Socket events.
 * This guarantees UI cache synchronization without secondary state store drift.
 */
export function setupSocketQuerySync(queryClient: QueryClient): () => void {
  const socket = getSocket();

  const handleJobOffer = () => {
    queryClient.invalidateQueries({ queryKey: ["worker", "offers"] });
  };

  const handleJobUpdated = (data?: { jobId?: string }) => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.all });
    if (data?.jobId) {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.JOBS.detail(data.jobId) });
    }
  };

  const handleMessageCreated = (data?: { conversationId?: string; jobId?: string }) => {
    const key = data?.conversationId || data?.jobId;
    if (key) {
      queryClient.invalidateQueries({ queryKey: ["messages", key] });
    }
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
  };

  const handleNotificationCreated = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  };

  socket.on("job.offer.created", handleJobOffer);
  socket.on("job.accepted", handleJobUpdated);
  socket.on("job.status.changed", handleJobUpdated);
  socket.on("job.completed", handleJobUpdated);
  socket.on("message.created", handleMessageCreated);
  socket.on("notification.created", handleNotificationCreated);

  return () => {
    socket.off("job.offer.created", handleJobOffer);
    socket.off("job.accepted", handleJobUpdated);
    socket.off("job.status.changed", handleJobUpdated);
    socket.off("job.completed", handleJobUpdated);
    socket.off("message.created", handleMessageCreated);
    socket.off("notification.created", handleNotificationCreated);
  };
}
