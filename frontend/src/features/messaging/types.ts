export type MessageType = "TEXT" | "IMAGE" | "LOCATION" | "SYSTEM";

export type MessageStatus = "SENDING" | "SENT" | "DELIVERED" | "READ" | "FAILED";

export interface ChatMessage {
  id: string;
  conversationId?: string;
  jobId: string;
  sender: {
    id: string;
    name: string;
    role: "customer" | "worker" | "system";
  };
  type: MessageType;
  content: string;
  mediaUrl?: string;
  locationData?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  status: MessageStatus;
  createdAt: string;
}

export interface ConversationSummary {
  id: string;
  jobId: string;
  jobTitle: string;
  otherParticipant: {
    id: string;
    name: string;
    role: "customer" | "worker";
    avatarUrl?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount: number;
  updatedAt: string;
}
