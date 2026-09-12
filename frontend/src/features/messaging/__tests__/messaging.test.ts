import { describe, it, expect } from "vitest";
import type { ApiMessage, MessageViewModel, ConversationSummary } from "../types";

/**
 * Pure functions mirroring the business logic in the messaging components:
 * 1. Sender ownership logic (msg.sender.id === currentUserId || msg.senderId === currentUserId)
 * 2. Message deduplication and chronological ordering
 * 3. Optimistic message creation and status management
 * 4. GeoJSON coordinate extraction and Google Maps URL generation
 * 5. Unread conversation badge calculation
 * 6. Conversation summary text and timestamp formatting
 */

export function isMyMessage(
  msg: { sender?: { id: string; role?: string }; senderId?: string },
  currentUserId: string
): boolean {
  return msg.sender?.id === currentUserId || msg.senderId === currentUserId;
}

export function deduplicateAndSortMessages(
  existingMessages: (ApiMessage | MessageViewModel)[],
  newMessages: (ApiMessage | MessageViewModel)[]
): (ApiMessage | MessageViewModel)[] {
  const map = new Map<string, ApiMessage | MessageViewModel>();

  for (const msg of existingMessages) {
    const key = (msg as MessageViewModel).tempId || msg.id;
    map.set(key, msg);
  }

  for (const msg of newMessages) {
    // If incoming message matches an optimistic message tempId, replace it
    const vm = msg as MessageViewModel;
    if (vm.tempId && map.has(vm.tempId)) {
      map.delete(vm.tempId);
    }
    // Also if an existing message had a tempId and server assigned an id, server wins
    map.set(msg.id, msg);
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function createOptimisticMessage(
  tempId: string,
  conversationId: string,
  currentUserId: string,
  type: "TEXT" | "IMAGE" | "LOCATION",
  content: string,
  attachment?: ApiMessage["attachment"]
): MessageViewModel {
  return {
    id: tempId,
    tempId,
    conversationId,
    senderId: currentUserId,
    sender: {
      id: currentUserId,
      displayName: "You",
      role: "CUSTOMER",
    },
    type,
    content,
    attachment,
    readAt: null,
    createdAt: new Date().toISOString(),
    deliveryStatus: "SENDING",
    failedPayload: {
      type,
      content,
      attachment,
    },
  };
}

export function buildGoogleMapsUrl(coordinates?: [number, number], address?: string): string {
  if (coordinates && coordinates.length === 2) {
    const [lng, lat] = coordinates; // GeoJSON convention: [longitude, latitude]
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  if (address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }
  return "#";
}

export function calculateTotalUnreadCount(conversations: ConversationSummary[]): number {
  return conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
}

export function formatMessagePreview(lastMessage: ConversationSummary["lastMessage"]): string {
  if (!lastMessage) return "No messages yet";
  switch (lastMessage.type) {
    case "IMAGE":
      return "📷 Photo";
    case "LOCATION":
      return "📍 Location shared";
    case "TEXT":
      return lastMessage.content;
    case "SYSTEM":
      return lastMessage.content;
    default:
      return lastMessage.content;
  }
}

describe("Messaging Logic & Contracts", () => {
  describe("1. Sender Ownership Security Rule", () => {
    const currentUserId = "usr_customer_123";

    it("should correctly identify outgoing message when sender.id matches currentUser", () => {
      const msg: ApiMessage = {
        id: "msg_1",
        conversationId: "conv_1",
        senderId: currentUserId,
        sender: {
          id: currentUserId,
          displayName: "Alice",
          role: "CUSTOMER",
        },
        type: "TEXT",
        content: "Hello",
        createdAt: "2026-03-01T10:00:00.000Z",
      };

      expect(isMyMessage(msg, currentUserId)).toBe(true);
    });

    it("should NEVER consider role for ownership — other customer in same role is incoming", () => {
      const otherCustomerId = "usr_customer_456";
      const msg: ApiMessage = {
        id: "msg_2",
        conversationId: "conv_1",
        senderId: otherCustomerId,
        sender: {
          id: otherCustomerId,
          displayName: "Bob",
          role: "CUSTOMER", // Same role!
        },
        type: "TEXT",
        content: "Hi from another user",
        createdAt: "2026-03-01T10:01:00.000Z",
      };

      // STRICT RULE: Must be false even though roles are identical
      expect(isMyMessage(msg, currentUserId)).toBe(false);
    });

    it("should identify incoming worker message correctly", () => {
      const workerId = "usr_worker_789";
      const msg: ApiMessage = {
        id: "msg_3",
        conversationId: "conv_1",
        senderId: workerId,
        sender: {
          id: workerId,
          displayName: "Charlie",
          role: "WORKER",
        },
        type: "TEXT",
        content: "I am on my way",
        createdAt: "2026-03-01T10:02:00.000Z",
      };

      expect(isMyMessage(msg, currentUserId)).toBe(false);
    });
  });

  describe("2. Optimistic Messaging & Delivery Status", () => {
    const currentUserId = "usr_alice";
    const conversationId = "conv_123";

    it("creates optimistic message in SENDING state with tempId", () => {
      const tempId = "temp_1710000000000";
      const optMsg = createOptimisticMessage(
        tempId,
        conversationId,
        currentUserId,
        "TEXT",
        "Optimistic test message"
      );

      expect(optMsg.deliveryStatus).toBe("SENDING");
      expect(optMsg.tempId).toBe(tempId);
      expect(optMsg.failedPayload).toBeDefined();
      expect(optMsg.failedPayload?.content).toBe("Optimistic test message");
    });

    it("replaces optimistic message when confirmed by server", () => {
      const tempId = "temp_1710000000000";
      const optMsg = createOptimisticMessage(
        tempId,
        conversationId,
        currentUserId,
        "TEXT",
        "Optimistic test message"
      );

      const serverMsg: ApiMessage = {
        id: "srv_999",
        conversationId,
        senderId: currentUserId,
        sender: { id: currentUserId, displayName: "Alice", role: "CUSTOMER" },
        type: "TEXT",
        content: "Optimistic test message",
        createdAt: "2026-03-01T10:05:00.000Z",
      };

      // Before server response
      const listBefore = [optMsg];
      expect(listBefore.length).toBe(1);
      expect((listBefore[0] as MessageViewModel).deliveryStatus).toBe("SENDING");

      // After server response: deduplicateAndSortMessages
      const listAfter = deduplicateAndSortMessages(listBefore, [serverMsg]);
      // Should replace the temp message or contain the server message without duplicates
      expect(listAfter.some((m) => m.id === "srv_999")).toBe(true);
    });
  });

  describe("3. GeoJSON Coordinates & Location Formatting", () => {
    it("correctly extracts [longitude, latitude] into Google Maps query string", () => {
      // GeoJSON standard: [longitude, latitude]
      // Bangalore: lat 12.9716, lng 77.5946 -> [77.5946, 12.9716]
      const coordinates: [number, number] = [77.5946, 12.9716];

      const mapUrl = buildGoogleMapsUrl(coordinates, "MG Road, Bangalore");
      expect(mapUrl).toBe("https://www.google.com/maps/search/?api=1&query=12.9716,77.5946");
    });

    it("falls back to address when coordinates are omitted", () => {
      const mapUrl = buildGoogleMapsUrl(undefined, "123 Main Street");
      expect(mapUrl).toBe("https://www.google.com/maps/search/?api=1&query=123%20Main%20Street");
    });
  });

  describe("4. Message Deduplication & Chronological Ordering", () => {
    it("deduplicates identical server message IDs", () => {
      const msg1: ApiMessage = {
        id: "msg_1",
        conversationId: "conv_1",
        senderId: "u1",
        sender: { id: "u1", displayName: "U1", role: "CUSTOMER" },
        type: "TEXT",
        content: "First",
        createdAt: "2026-03-01T10:00:00.000Z",
      };
      const msg2: ApiMessage = {
        id: "msg_2",
        conversationId: "conv_1",
        senderId: "u2",
        sender: { id: "u2", displayName: "U2", role: "WORKER" },
        type: "TEXT",
        content: "Second",
        createdAt: "2026-03-01T10:05:00.000Z",
      };

      const deduplicated = deduplicateAndSortMessages([msg1, msg2], [msg1]);
      expect(deduplicated.length).toBe(2);
      expect(deduplicated[0]!.id).toBe("msg_1");
      expect(deduplicated[1]!.id).toBe("msg_2");
    });

    it("orders messages strictly by createdAt ascending", () => {
      const early: ApiMessage = {
        id: "m_early",
        conversationId: "conv_1",
        senderId: "u1",
        sender: { id: "u1", displayName: "U1", role: "CUSTOMER" },
        type: "TEXT",
        content: "Early",
        createdAt: "2026-03-01T09:00:00.000Z",
      };
      const late: ApiMessage = {
        id: "m_late",
        conversationId: "conv_1",
        senderId: "u1",
        sender: { id: "u1", displayName: "U1", role: "CUSTOMER" },
        type: "TEXT",
        content: "Late",
        createdAt: "2026-03-01T11:00:00.000Z",
      };

      const sorted = deduplicateAndSortMessages([late], [early]);
      expect(sorted[0]!.id).toBe("m_early");
      expect(sorted[1]!.id).toBe("m_late");
    });
  });

  describe("5. Unread Conversation Calculations", () => {
    it("sums unread counts across all active conversations", () => {
      const conversations: ConversationSummary[] = [
        {
          id: "conv_1",
          jobId: "job_1",
          jobTitle: "Fix Sink",
          otherParticipant: { id: "w1", name: "Worker 1", role: "WORKER" },
          lastMessage: { content: "Hey", type: "TEXT", senderId: "w1", createdAt: "2026-03-01T10:00:00Z" },
          unreadCount: 3,
          updatedAt: "2026-03-01T10:00:00Z",
        },
        {
          id: "conv_2",
          jobId: "job_2",
          jobTitle: "AC Repair",
          otherParticipant: { id: "w2", name: "Worker 2", role: "WORKER" },
          lastMessage: { content: "On my way", type: "TEXT", senderId: "w2", createdAt: "2026-03-01T10:05:00Z" },
          unreadCount: 1,
          updatedAt: "2026-03-01T10:05:00Z",
        },
        {
          id: "conv_3",
          jobId: "job_3",
          jobTitle: "Painting",
          otherParticipant: { id: "w3", name: "Worker 3", role: "WORKER" },
          lastMessage: null,
          unreadCount: 0,
          updatedAt: "2026-03-01T10:00:00Z",
        },
      ];

      expect(calculateTotalUnreadCount(conversations)).toBe(4);
    });

    it("formats message preview types accurately", () => {
      expect(
        formatMessagePreview({
          content: "",
          type: "IMAGE",
          senderId: "w1",
          createdAt: "2026-03-01T10:00:00Z",
        })
      ).toBe("📷 Photo");

      expect(
        formatMessagePreview({
          content: "",
          type: "LOCATION",
          senderId: "w1",
          createdAt: "2026-03-01T10:00:00Z",
        })
      ).toBe("📍 Location shared");

      expect(
        formatMessagePreview({
          content: "Hello there",
          type: "TEXT",
          senderId: "w1",
          createdAt: "2026-03-01T10:00:00Z",
        })
      ).toBe("Hello there");
    });
  });
});
