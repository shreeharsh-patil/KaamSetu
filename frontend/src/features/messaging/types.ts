export type MessageType = "TEXT" | "IMAGE" | "LOCATION" | "SYSTEM";

export interface MessageAttachment {
  key?: string;
  url?: string;
  mimeType?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  coordinates?: [number, number]; // GeoJSON convention: [longitude, latitude]
  address?: string;
}

export interface MessageSender {
  id: string;
  displayName: string;
  role: "CUSTOMER" | "WORKER" | "ADMIN" | "SUPPORT";
  avatarUrl?: string | null;
}

/**
 * Persisted message contract from backend API (IMessageView).
 */
export interface ApiMessage {
  id: string;
  conversationId: string;
  sender: MessageSender;
  senderId: string;
  type: MessageType;
  content: string;
  attachment?: MessageAttachment;
  readAt?: string | null;
  createdAt: string;
}

/** Backward compatibility alias */
export type ChatMessage = ApiMessage;

/**
 * UI-only presentation status for messages.
 */
export type MessageDeliveryStatus = "SENDING" | "SENT" | "READ" | "FAILED";

export interface MessageViewModel extends ApiMessage {
  /** Local-only client identifier when sending optimistically before server confirms ID */
  tempId?: string;
  /** UI presentation status: SENDING | SENT | READ | FAILED */
  deliveryStatus: MessageDeliveryStatus;
  /** If delivery failed, stores the original payload for retry */
  failedPayload?: {
    type: MessageType;
    content: string;
    attachment?: MessageAttachment;
  };
}

export interface ConversationSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  otherParticipant: {
    id: string;
    name: string;
    role: "CUSTOMER" | "WORKER" | "ADMIN" | "SUPPORT";
    avatarUrl?: string | null;
  };
  lastMessage: {
    content: string;
    type: MessageType;
    senderId: string;
    createdAt: string;
  } | null;
  lastMessageAt?: string | null;
  unreadCount: number;
  updatedAt: string;
}

export interface MessagesPageResponse {
  messages: ApiMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}
