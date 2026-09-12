import { Types } from 'mongoose';
import { UserRole, type IConversationEntity } from '@kaamsetu/types';
import { conversationRepository, IConversationRepository } from './conversation.repository.js';
import { jobRepository, IJobRepository } from '../jobs/job.repository.js';
import { userRepository } from '../users/user.repository.js';
import { workerProfileRepository } from '../worker-profiles/worker-profile.repository.js';
import { customerProfileRepository } from '../customer-profiles/customer-profile.repository.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../errors/index.js';

/** Conversation summary shape returned to clients. */
export interface ConversationSummaryView {
  id: string;
  jobId: string;
  jobTitle: string;
  otherParticipant: {
    id: string;
    name: string;
    role: UserRole;
  };
  lastMessageAt: string | null;
  updatedAt: string;
}

export class ConversationService {
  constructor(
    private readonly conversationRepo: IConversationRepository = conversationRepository,
    private readonly jobRepo: IJobRepository = jobRepository
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
   * with the job title and the other participant's display name resolved.
   */
  async listConversationsForUser(
    user: { id: string; role: UserRole }
  ): Promise<ConversationSummaryView[]> {
    const conversations = await this.conversationRepo.listForUser(user.id);

    return Promise.all(
      conversations.map(async (conversation) => {
        const job = await this.jobRepo.findById(conversation.jobId);

        const otherId = conversation.participants.find((p) => p !== user.id);
        const otherParticipant = otherId ? await this.resolveParticipantName(otherId) : null;

        return {
          id: conversation.id,
          jobId: conversation.jobId,
          jobTitle: job?.title ?? 'Service request',
          otherParticipant: {
            id: otherId ?? '',
            name: otherParticipant?.name ?? 'Participant',
            role: otherParticipant?.role ?? UserRole.CUSTOMER,
          },
          lastMessageAt: conversation.lastMessageAt
            ? new Date(conversation.lastMessageAt).toISOString()
            : null,
          updatedAt: new Date(conversation.updatedAt).toISOString(),
        };
      })
    );
  }

  /** Resolves a user id to a display name via profile-first, user fallback. */
  private async resolveParticipantName(
    userId: string
  ): Promise<{ name: string; role: UserRole } | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;

    let name = user.phoneNumber;
    if (user.role === UserRole.WORKER) {
      const profile = await workerProfileRepository.findByUserId(userId);
      if (profile?.displayName) name = profile.displayName;
    } else if (user.role === UserRole.CUSTOMER) {
      const profile = await customerProfileRepository.findByUserId(userId);
      if (profile?.displayName) name = profile.displayName;
    }

    return { name, role: user.role };
  }
}

export const conversationService = new ConversationService();
