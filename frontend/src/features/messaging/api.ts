import { apiClient } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { ChatMessage, ConversationSummary } from "./types";

export const messagingApi = {
  getMessages: async (jobId: string): Promise<ChatMessage[]> => {
    const res = await apiClient.get<{ messages: ChatMessage[] } | ChatMessage[]>(
      API_ENDPOINTS.MESSAGES.LIST(jobId)
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
    if (Array.isArray(res)) return res;
    return res.conversations ?? [];
  },
};
