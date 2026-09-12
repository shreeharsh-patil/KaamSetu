import { ClientSession, Types } from 'mongoose';
import { ConversationModel, toConversationEntity } from './conversation.model.js';
import type { IConversationEntity } from '@kaamsetu/types';

export interface IConversationRepository {
  findById(id: string): Promise<IConversationEntity | null>;
  findByJobId(jobId: string): Promise<IConversationEntity | null>;
  listForUser(userId: string, limit?: number): Promise<IConversationEntity[]>;
  create(jobId: string, participants: string[], session?: ClientSession): Promise<IConversationEntity>;
  getOrCreateForJob(
    jobId: string,
    participants: string[],
    session?: ClientSession
  ): Promise<IConversationEntity>;
  addParticipant(conversationId: string, userId: string): Promise<IConversationEntity | null>;
  updateLastMessageAt(conversationId: string, timestamp?: Date): Promise<void>;
}

export class ConversationRepository implements IConversationRepository {
  async findById(id: string): Promise<IConversationEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await ConversationModel.findById(id).exec();
    return doc ? toConversationEntity(doc) : null;
  }

  async findByJobId(jobId: string): Promise<IConversationEntity | null> {
    if (!Types.ObjectId.isValid(jobId)) return null;
    const doc = await ConversationModel.findOne({ jobId }).exec();
    return doc ? toConversationEntity(doc) : null;
  }

  async listForUser(userId: string, limit = 50): Promise<IConversationEntity[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const docs = await ConversationModel.find({ participants: new Types.ObjectId(userId) })
      .sort({ updatedAt: -1 })
      .limit(Math.min(Math.max(1, limit), 100))
      .exec();
    return docs.map(toConversationEntity);
  }

  async create(
    jobId: string,
    participants: string[],
    session?: ClientSession
  ): Promise<IConversationEntity> {
    const participantObjectIds = Array.from(
      new Set(participants.filter((p) => Types.ObjectId.isValid(p)))
    ).map((p) => new Types.ObjectId(p));

    const docs = await ConversationModel.create(
      [
        {
          jobId: new Types.ObjectId(jobId),
          participants: participantObjectIds,
          lastMessageAt: null,
        },
      ],
      { session }
    );

    return toConversationEntity(docs[0]!);
  }

  async getOrCreateForJob(
    jobId: string,
    participants: string[],
    session?: ClientSession
  ): Promise<IConversationEntity> {
    const existing = await this.findByJobId(jobId);
    if (existing) {
      // Ensure all participants are in the conversation
      const missingParticipants = participants.filter(
        (p) => !existing.participants.includes(p) && Types.ObjectId.isValid(p)
      );
      if (missingParticipants.length > 0) {
        const updated = await ConversationModel.findByIdAndUpdate(
          existing.id,
          {
            $addToSet: {
              participants: {
                $each: missingParticipants.map((p) => new Types.ObjectId(p)),
              },
            },
          },
          { new: true, session }
        ).exec();
        if (updated) return toConversationEntity(updated);
      }
      return existing;
    }

    try {
      return await this.create(jobId, participants, session);
    } catch (err: unknown) {
      // Handle race condition where conversation was created concurrently
      const duplicateError = err as { code?: number };
      if (duplicateError?.code === 11000) {
        const found = await this.findByJobId(jobId);
        if (found) return found;
      }
      throw err;
    }
  }

  async addParticipant(conversationId: string, userId: string): Promise<IConversationEntity | null> {
    if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) {
      return null;
    }
    const updated = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { $addToSet: { participants: new Types.ObjectId(userId) } },
      { new: true }
    ).exec();
    return updated ? toConversationEntity(updated) : null;
  }

  async updateLastMessageAt(conversationId: string, timestamp: Date = new Date()): Promise<void> {
    if (!Types.ObjectId.isValid(conversationId)) return;
    await ConversationModel.findByIdAndUpdate(conversationId, {
      $set: { lastMessageAt: timestamp },
    }).exec();
  }
}

export const conversationRepository = new ConversationRepository();
