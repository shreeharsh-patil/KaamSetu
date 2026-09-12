import { Types } from 'mongoose';
import { UserRole, type IConversationEntity, type IConversationSummaryView, type IMessageEntity } from '@kaamsetu/types';
import { conversationRepository, IConversationRepository } from './conversation.repository.js';
import { jobRepository, IJobRepository } from '../jobs/job.repository.js';
import { JobModel } from '../jobs/job.model.js';
import { messageRepository, IMessageRepository } from '../messages/message.repository.js';
import { MessageModel, toMessageEntity, type IMessageDocument } from '../messages/message.model.js';
import { userRepository } from '../users/user.repository.js';
import { UserModel } from '../users/user.model.js';
import { workerProfileRepository } from '../worker-profiles/worker-profile.repository.js';
import { WorkerProfileModel } from '../worker-profiles/worker-profile.model.js';
import { customerProfileRepository } from '../customer-profiles/customer-profile.repository.js';
import { CustomerProfileModel } from '../customer-profiles/customer-profile.model.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../errors/index.js';

export type ConversationSummaryView = IConversationSummaryView;

export class ConversationService {
  constructor(
    private readonly conversationRepo: IConversationRepository = conversationRepository,
    private readonly jobRepo: IJobRepository = jobRepository,
    private readonly messageRepo: IMessageRepository = messageRepository
  ) {}

  /**
   * Retrieves or creates the single conversation associated with a job.
   * Access rule: Only the customer, assigned worker, or admin can access.
   */
  async getConversationForJob(
    jobId: string,
    user: { id: string; role: UserRole }
  ): Promise<IConversationEntity> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new BadRequestError('Invalid job ID format');
    }

    const job = await this.jobRepo.findById(jobId);
    if (!job) {
      throw new NotFoundError('Job not found');
    }

    const isCustomer = job.customerId === user.id;
    const isAssignedWorker = job.assignedWorkerId === user.id;
    const isAdmin = user.role === UserRole.ADMIN;

    if (!isCustomer && !isAssignedWorker && !isAdmin) {
      throw new ForbiddenError('Only job participants can access this conversation');
    }

    const participants = [job.customerId];
    if (job.assignedWorkerId) {
      participants.push(job.assignedWorkerId);
    }

    return this.conversationRepo.getOrCreateForJob(jobId, participants);
  }

  async getConversationById(
    conversationId: string,
    user: { id: string; role: UserRole }
  ): Promise<IConversationEntity> {
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

    return conversation;
  }

  /**
   * Lists all conversations the user participates in, newest activity first,
   * with the job title, unread count, last message, and other participant's display name resolved.
   * Optimized to batch queries and eliminate N+1 database round-trips.
   */
  async listConversationsForUser(
    user: { id: string; role: UserRole }
  ): Promise<IConversationSummaryView[]> {
    const conversations = await this.conversationRepo.listForUser(user.id);
    if (conversations.length === 0) {
      return [];
    }

    // 1. Batch fetch job titles
    const jobIds = Array.from(
      new Set(conversations.map((c) => c.jobId).filter((id) => Types.ObjectId.isValid(id)))
    );
    const jobs = await JobModel.find(
      { _id: { $in: jobIds.map((id) => new Types.ObjectId(id)) } },
      { title: 1 }
    ).lean();
    const jobMap = new Map<string, string>();
    jobs.forEach((j) => jobMap.set(j._id.toString(), j.title));

    // 2. Batch fetch other participants
    const otherUserIds = Array.from(
      new Set(
        conversations
          .flatMap((c) => c.participants.filter((p) => p !== user.id))
          .filter((id) => Types.ObjectId.isValid(id))
      )
    );

    const [users, workerProfiles, customerProfiles] = await Promise.all([
      UserModel.find({ _id: { $in: otherUserIds.map((id) => new Types.ObjectId(id)) } }).lean(),
      WorkerProfileModel.find({ userId: { $in: otherUserIds } }).lean(),
      CustomerProfileModel.find({ userId: { $in: otherUserIds } }).lean(),
    ]);

    const workerProfileMap = new Map<string, string>();
    workerProfiles.forEach((wp) => {
      if (wp.displayName) workerProfileMap.set(wp.userId.toString(), wp.displayName);
    });

    const customerProfileMap = new Map<string, string>();
    customerProfiles.forEach((cp) => {
      if (cp.displayName) customerProfileMap.set(cp.userId.toString(), cp.displayName);
    });

    const participantMap = new Map<
      string,
      { name: string; role: UserRole; avatarUrl: string | null }
    >();

    users.forEach((u) => {
      const uId = u._id.toString();
      let name = u.phoneNumber ? `User ${u.phoneNumber.slice(-4)}` : 'User';
      if (u.role === UserRole.WORKER && workerProfileMap.has(uId)) {
        name = workerProfileMap.get(uId)!;
      } else if (u.role === UserRole.CUSTOMER && customerProfileMap.has(uId)) {
        name = customerProfileMap.get(uId)!;
      } else if (u.role === UserRole.ADMIN) {
        name = 'KaamSetu Support';
      }

      participantMap.set(uId, {
        name,
        role: u.role as UserRole,
        avatarUrl: u.profilePhotoUrl ?? null,
      });
    });

    // 3. Batch aggregate unread counts and last messages
    const convObjectIds = conversations.map((c) => new Types.ObjectId(c.id));
    const userObjectId = new Types.ObjectId(user.id);

    const [unreadCounts, lastMessages] = await Promise.all([
      MessageModel.aggregate<{ _id: Types.ObjectId; count: number }>([
        {
          $match: {
            conversationId: { $in: convObjectIds },
            senderId: { $ne: userObjectId },
            readAt: null,
          },
        },
        {
          $group: {
            _id: '$conversationId',
            count: { $sum: 1 },
          },
        },
      ]),
      MessageModel.aggregate<{ _id: Types.ObjectId; lastDoc: IMessageDocument }>([
        { $match: { conversationId: { $in: convObjectIds } } },
        { $sort: { createdAt: -1, _id: -1 } },
        {
          $group: {
            _id: '$conversationId',
            lastDoc: { $first: '$$ROOT' },
          },
        },
      ]),
    ]);

    const unreadMap = new Map<string, number>();
    unreadCounts.forEach((item) => unreadMap.set(item._id.toString(), item.count));

    const lastMsgMap = new Map<string, IMessageEntity>();
    lastMessages.forEach((item) => {
      lastMsgMap.set(item._id.toString(), toMessageEntity(item.lastDoc));
    });

    return conversations.map((conversation) => {
      const otherId = conversation.participants.find((p) => p !== user.id);
      const participantInfo = otherId ? participantMap.get(otherId) : null;
      const lastMsg = lastMsgMap.get(conversation.id);
      const unreadCount = unreadMap.get(conversation.id) ?? 0;

      return {
        id: conversation.id,
        jobId: conversation.jobId,
        jobTitle: jobMap.get(conversation.jobId) ?? 'Service request',
        otherParticipant: {
          id: otherId ?? '',
          name: participantInfo?.name ?? 'Participant',
          role: participantInfo?.role ?? UserRole.CUSTOMER,
          avatarUrl: participantInfo?.avatarUrl ?? null,
        },
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              type: lastMsg.type,
              senderId: lastMsg.senderId,
              createdAt: new Date(lastMsg.createdAt).toISOString(),
            }
          : null,
        lastMessageAt: conversation.lastMessageAt
          ? new Date(conversation.lastMessageAt).toISOString()
          : null,
        unreadCount,
        updatedAt: new Date(conversation.updatedAt).toISOString(),
      };
    });
  }

  /**
   * Retrieves conversation summary by conversation ID.
   */
  async getConversationSummary(
    conversationId: string,
    user: { id: string; role: UserRole }
  ): Promise<IConversationSummaryView> {
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

    const otherId = conversation.participants.find((p) => p !== user.id);

    const [job, otherParticipant, lastMsg, unreadCount] = await Promise.all([
      this.jobRepo.findById(conversation.jobId),
      otherId ? this.resolveParticipant(otherId) : null,
      this.messageRepo.findLastMessage(conversation.id),
      this.messageRepo.countUnread(conversation.id, user.id),
    ]);

    return {
      id: conversation.id,
      jobId: conversation.jobId,
      jobTitle: job?.title ?? 'Service request',
      otherParticipant: {
        id: otherId ?? '',
        name: otherParticipant?.name ?? 'Participant',
        role: otherParticipant?.role ?? UserRole.CUSTOMER,
        avatarUrl: otherParticipant?.avatarUrl ?? null,
      },
      lastMessage: lastMsg
        ? {
            content: lastMsg.content,
            type: lastMsg.type,
            senderId: lastMsg.senderId,
            createdAt: new Date(lastMsg.createdAt).toISOString(),
          }
        : null,
      lastMessageAt: conversation.lastMessageAt
        ? new Date(conversation.lastMessageAt).toISOString()
        : null,
      unreadCount,
      updatedAt: new Date(conversation.updatedAt).toISOString(),
    };
  }

  /** Resolves a user id to a display name and avatar via profile-first, user fallback. */
  private async resolveParticipant(
    userId: string
  ): Promise<{ name: string; role: UserRole; avatarUrl: string | null } | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    let name = user.phoneNumber ? `User ${user.phoneNumber.slice(-4)}` : 'User';
    const avatarUrl = user.profilePhotoUrl ?? null;

    if (user.role === UserRole.WORKER) {
      const profile = await workerProfileRepository.findByUserId(userId);
      if (profile?.displayName) name = profile.displayName;
    } else if (user.role === UserRole.CUSTOMER) {
      const profile = await customerProfileRepository.findByUserId(userId);
      if (profile?.displayName) name = profile.displayName;
    } else if (user.role === UserRole.ADMIN) {
      name = 'KaamSetu Support';
    }

    return { name, role: user.role, avatarUrl };
  }
}

export const conversationService = new ConversationService();
