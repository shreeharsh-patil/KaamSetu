import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ChatMessage, ConversationSummary } from "./types";

export const messagingApi = {
  /**
   * Resolve (or create) the conversation for a job and return its id.
   * Chat links carry the jobId (the id everyone has before a conversation
   * exists); the messages API needs the conversation id.
   */
  resolveConversationForJob: async (jobId: string): Promise<string> => {
    const res = await apiClient.get<{ conversation: { id: string } }>(
      API_ENDPOINTS.CONVERSATIONS.FOR_JOB(jobId)
    );
    return res.conversation.id;
  },

  getMessages: async (conversationId: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get<{ messages: ChatMessage[] } | ChatMessage[]>(
      API_ENDPOINTS.MESSAGES.LIST(conversationId)
    );
    if (Array.isArray(res)) return res;
    return res.messages ?? [];
  },

  sendMessage: async (
    conversationId: string,
    payload: { content: string; type?: string; mediaUrl?: string }
  ): Promise<ChatMessage> => {
    const response = await apiClient.post<{ message: ChatMessage }>(API_ENDPOINTS.MESSAGES.SEND(conversationId), payload);
    return response.message;
  },

  getConversations: async (): Promise<ConversationSummary[]> => {
    const res = await apiClient.get<{ conversations: ConversationSummary[] } | ConversationSummary[]>(
      "/conversations"
    );
    if (Array.isArray(res)) return res;      return res.conversations ?? [];
  },

  /** Mark all incoming messages in a conversation as read. */
  markAsRead: async (conversationId: string): Promise<void> => {
    await apiClient.post(`/conversations/${conversationId}/read`, {});
  },
};
