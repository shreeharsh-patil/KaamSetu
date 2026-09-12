import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ApiMessage,
  ConversationSummary,
  MessagesPageResponse,
  MessageType,
  MessageAttachment,
} from "./types";

export const messagingApi = {
  /**
   * Resolve (or create) the conversation for a job and return its id.
   */
  resolveConversationForJob: async (jobId: string): Promise<string> => {
    const res = await apiClient.get<{ conversation: { id: string } }>(
      API_ENDPOINTS.CONVERSATIONS.FOR_JOB(jobId)
    );
    return res.conversation.id;
  },

  /**
   * Fetch conversation summary by conversation ID.
   */
  getConversation: async (conversationId: string): Promise<ConversationSummary> => {
    const res = await apiClient.get<{ conversation: ConversationSummary }>(
      API_ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)
    );
    return res.conversation;
  },

  /**
   * List messages for a conversation with cursor pagination.
   */
  getMessages: async (
    conversationId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<MessagesPageResponse> => {
    const res = await apiClient.get<{
      messages: ApiMessage[];
      nextCursor: string | null;
      hasMore: boolean;
    }>(API_ENDPOINTS.MESSAGES.LIST(conversationId), {
      params: {
        ...(cursor ? { cursor } : {}),
        limit,
      },
    });
    return {
      messages: res.messages ?? [],
      nextCursor: res.nextCursor ?? null,
      hasMore: Boolean(res.hasMore),
    };
  },

  /**
   * Send a message to a conversation.
   */
  sendMessage: async (
    conversationId: string,
    payload: {
      content: string;
      type: MessageType;
      attachment?: MessageAttachment;
    }
  ): Promise<ApiMessage> => {
    const res = await apiClient.post<{ message: ApiMessage }>(
      API_ENDPOINTS.MESSAGES.SEND(conversationId),
      payload
    );
    return res.message;
  },

  /**
   * List conversations for the authenticated user.
   */
  getConversations: async (): Promise<ConversationSummary[]> => {
    const res = await apiClient.get<{ conversations: ConversationSummary[] }>(
      API_ENDPOINTS.CONVERSATIONS.LIST
    );
    return res.conversations ?? [];
  },

  /**
   * Mark all incoming messages in a conversation as read.
   */
  markAsRead: async (conversationId: string): Promise<{ modifiedCount: number }> => {
    const res = await apiClient.post<{ modifiedCount: number }>(
      API_ENDPOINTS.CONVERSATIONS.MARK_READ(conversationId),
      {}
    );
    return res;
  },
};
