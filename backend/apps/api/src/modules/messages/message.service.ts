import { Types } from 'mongoose';
import {
  UserRole,
  MessageType,
  NotificationChannel,
  NotificationType,
  type IMessageView,
  type IMessageSenderView,
  type CursorPage,
} from '@kaamsetu/types';
import type { CreateMessageInputDto } from '@kaamsetu/validation';
import { messageRepository, IMessageRepository } from './message.repository.js';
import { conversationRepository, IConversationRepository } from '../conversations/conversation.repository.js';
import { notificationService, NotificationService } from '../notifications/notification.service.js';
import { realtimeGateway, RealtimeGateway } from '../../realtime/index.js';
import { userRepository } from '../users/user.repository.js';
import { workerProfileRepository } from '../worker-profiles/worker-profile.repository.js';
import { customerProfileRepository } from '../customer-profiles/customer-profile.repository.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../errors/index.js';

export class MessageService {
  constructor(
    private readonly messageRepo: IMessageRepository = messageRepository,
    private readonly conversationRepo: IConversationRepository = conversationRepository,
    private readonly notifications: NotificationService = notificationService,
    private readonly realtime: RealtimeGateway = realtimeGateway
  ) {}

  /**
   * Resolves a user ID to an IMessageSenderView with privacy protection.
   */
  async resolveSender(userId: string): Promise<IMessageSenderView> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return {
        id: userId,
        displayName: 'User',
        role: UserRole.CUSTOMER,
        avatarUrl: null,
      };
    }

    let displayName = user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : 'User';
    const avatarUrl = user.profilePhotoUrl ?? null;

    if (user.role === UserRole.WORKER) {
      const profile = await workerProfileRepository.findByUserId(userId);
      if (profile?.displayName) displayName = profile.displayName;
    } else if (user.role === UserRole.CUSTOMER) {
      const profile = await customerProfileRepository.findByUserId(userId);
      if (profile?.displayName) displayName = profile.displayName;
    } else if (user.role === UserRole.ADMIN) {
      displayName = 'KaamSetu Support';
    }

    return {
      id: user.id,
      displayName,
      role: user.role,
      avatarUrl,
    };
  }

  /**
   * Fetch messages for a conversation with cursor pagination.
   * Access rule: Only conversation participants or admins can view messages.
   */
  async getMessages(
    conversationId: string,
    user: { id: string; role: UserRole },
    cursor?: string,
    limit?: number
  ): Promise<CursorPage<IMessageView>> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestError('Invalid conversation ID format');
    }

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isParticipant = conversation.participants.includes(user.id);
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    const page = await this.messageRepo.listMessagesCursor(conversationId, cursor, limit);

    // Batch resolve distinct senders to avoid N+1 queries
    const distinctSenderIds = Array.from(new Set(page.items.map((m) => m.senderId)));
    const senderMap = new Map<string, IMessageSenderView>();

    await Promise.all(
      distinctSenderIds.map(async (senderId) => {
        const s = await this.resolveSender(senderId);
        senderMap.set(senderId, s);
      })
    );

    const items: IMessageView[] = page.items.map((m) => {
      const sender = senderMap.get(m.senderId) ?? {
        id: m.senderId,
        displayName: 'User',
        role: UserRole.CUSTOMER,
        avatarUrl: null,
      };

      return {
        id: m.id,
        conversationId: m.conversationId,
        sender,
        senderId: m.senderId,
        type: m.type,
        content: m.content,
        attachment: m.attachment ?? undefined,
        readAt: m.readAt ? new Date(m.readAt).toISOString() : null,
        createdAt: new Date(m.createdAt).toISOString(),
      };
    });

    return {
      items,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    };
  }

  /**
   * Post a new message to a conversation.
   * Access rule: Only participants or admins can send messages.
   * Safety rule: Clients cannot submit SYSTEM messages.
   */
  async sendMessage(
    conversationId: string,
    sender: { id: string; role: UserRole },
    input: CreateMessageInputDto
  ): Promise<IMessageView> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestError('Invalid conversation ID format');
    }

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isParticipant = conversation.participants.includes(sender.id);
    const isAdmin = sender.role === UserRole.ADMIN;

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    // Safety: prevent clients from spoofing system-generated messages
    if ((input.type as string) === MessageType.SYSTEM) {
      throw new ForbiddenError('Clients cannot send SYSTEM messages');
    }

    // Attachment validation
    if (input.type === MessageType.IMAGE) {
      if (!input.attachment || (!input.attachment.key && !input.attachment.url)) {
        throw new BadRequestError('IMAGE messages require attachment with key or url');
      }
    } else if (input.type === MessageType.LOCATION) {
      if (!input.attachment || !input.attachment.coordinates) {
        throw new BadRequestError('LOCATION messages require attachment with coordinates [lng, lat]');
      }
    }

    const message = await this.messageRepo.create({
      conversationId,
      senderId: sender.id,
      type: input.type as MessageType,
      content: input.content ?? '',
      attachment: input.attachment ?? undefined,
    });

    // Update conversation last message timestamp
    await this.conversationRepo.updateLastMessageAt(conversationId, message.createdAt);

    // Build the MessageView DTO for client & realtime consumers
    const senderView = await this.resolveSender(sender.id);
    const messageView: IMessageView = {
      id: message.id,
      conversationId: message.conversationId,
      sender: senderView,
      senderId: sender.id,
      type: message.type,
      content: message.content,
      attachment: message.attachment ?? undefined,
      readAt: message.readAt ? new Date(message.readAt).toISOString() : null,
      createdAt: new Date(message.createdAt).toISOString(),
    };

    // Emit realtime notifications via Socket.IO
    const newMsgPayload = {
      conversationId,
      jobId: conversation.jobId,
      message: messageView,
    };
    this.realtime.emitToJob(conversation.jobId, 'message.created', newMsgPayload);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.realtime.getIO()?.to(`conversation:${conversationId}`) as any)?.emit('message.created', newMsgPayload);

    // Notify other participants in the conversation
    const otherParticipants = conversation.participants.filter((p) => p !== sender.id);
    for (const recipientId of otherParticipants) {
      this.realtime.emitToUser(recipientId, 'message.created', newMsgPayload);

      // Enqueue notification delivery
      const previewText =
        input.type === MessageType.TEXT
          ? input.content.substring(0, 80)
          : `Sent a ${input.type.toLowerCase()}`;

      void this.notifications.sendNotification({
        userId: recipientId,
        type: NotificationType.NEW_MESSAGE,
        channel: NotificationChannel.IN_APP,
        title: 'New message received',
        body: previewText,
        data: {
          conversationId,
          messageId: message.id,
          jobId: conversation.jobId,
        },
      });
    }

    return messageView;
  }

  /**
   * Mark all unread messages in the conversation sent by other participants as read.
   */
  async markAsRead(
    conversationId: string,
    reader: { id: string; role: UserRole }
  ): Promise<{ modifiedCount: number }> {
    if (!Types.ObjectId.isValid(conversationId)) {
      throw new BadRequestError('Invalid conversation ID format');
    }

    const conversation = await this.conversationRepo.findById(conversationId);
    if (!conversation) {
      throw new NotFoundError('Conversation not found');
    }

    const isParticipant = conversation.participants.includes(reader.id);
    const isAdmin = reader.role === UserRole.ADMIN;

    if (!isParticipant && !isAdmin) {
      throw new ForbiddenError('You are not a participant in this conversation');
    }

    const result = await this.messageRepo.markAsRead(conversationId, reader.id);

    // Emit read receipt in realtime
    const readPayload = {
      conversationId,
      readerId: reader.id,
      readAt: new Date().toISOString(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.realtime.getIO()?.to(`conversation:${conversationId}`) as any)?.emit('message.read', readPayload);

    return result;
  }
}

export const messageService = new MessageService();
