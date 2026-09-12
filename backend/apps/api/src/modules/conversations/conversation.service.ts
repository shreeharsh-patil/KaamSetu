import { Types } from 'mongoose';
import { UserRole, type IConversationEntity } from '@kaamsetu/types';
import { conversationRepository, IConversationRepository } from './conversation.repository.js';
import { jobRepository, IJobRepository } from '../jobs/job.repository.js';
import { NotFoundError, ForbiddenError, BadRequestError } from '../../errors/index.js';

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
}

export const conversationService = new ConversationService();
