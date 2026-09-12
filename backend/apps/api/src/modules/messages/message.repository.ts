import { ClientSession, FilterQuery, Types } from 'mongoose';
import { MessageModel, toMessageEntity, IMessageDocument } from './message.model.js';
import type {
  IMessageEntity,
  ICreateMessageInput,
  CursorPage,
} from '@kaamsetu/types';

export interface IMessageRepository {
  create(data: ICreateMessageInput, session?: ClientSession): Promise<IMessageEntity>;
  findById(id: string): Promise<IMessageEntity | null>;
  listMessagesCursor(
    conversationId: string,
    cursor?: string,
    limit?: number
  ): Promise<CursorPage<IMessageEntity>>;
  markAsRead(conversationId: string, readerUserId: string): Promise<{ modifiedCount: number }>;
  countUnread(conversationId: string, userId: string): Promise<number>;
}

export class MessageRepository implements IMessageRepository {
  async create(data: ICreateMessageInput, session?: ClientSession): Promise<IMessageEntity> {
    const docs = await MessageModel.create(
      [
        {
          conversationId: new Types.ObjectId(data.conversationId),
          senderId: new Types.ObjectId(data.senderId),
          type: data.type,
          content: data.content ?? '',
          attachment: data.attachment ? { ...data.attachment } : undefined,
          readAt: null,
          createdAt: new Date(),
        },
      ],
      { session }
    );

    return toMessageEntity(docs[0]!);
  }

  async findById(id: string): Promise<IMessageEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await MessageModel.findById(id).exec();
    return doc ? toMessageEntity(doc) : null;
  }

  async listMessagesCursor(
    conversationId: string,
    cursor?: string,
    limitParam: number = 20
  ): Promise<CursorPage<IMessageEntity>> {
    if (!Types.ObjectId.isValid(conversationId)) {
      return { items: [], nextCursor: null, hasMore: false };
    }

    const limit = Math.min(Math.max(1, limitParam), 50);
    const query: FilterQuery<IMessageDocument> = {
      conversationId: new Types.ObjectId(conversationId),
    };

    if (cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(cursor, 'base64url').toString('utf8')
        ) as { createdAt: string; id: string };

        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        query.$or = [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ];
      } catch {
        // Fallback to first page on corrupted cursor
      }
    }

    // Fetch limit + 1 to check for next page
    const docs = await MessageModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    if (hasMore) {
      docs.pop();
    }

    let nextCursor: string | null = null;
    if (hasMore && docs.length > 0) {
      const lastDoc = docs[docs.length - 1];
      if (lastDoc) {
        nextCursor = Buffer.from(
          JSON.stringify({
            createdAt: lastDoc.createdAt.toISOString(),
            id: lastDoc._id.toString(),
          })
        ).toString('base64url');
      }
    }

    return {
      items: docs.map(toMessageEntity),
      nextCursor,
      hasMore,
    };
  }

  async markAsRead(conversationId: string, readerUserId: string): Promise<{ modifiedCount: number }> {
    if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(readerUserId)) {
      return { modifiedCount: 0 };
    }

    const res = await MessageModel.updateMany(
      {
        conversationId: new Types.ObjectId(conversationId),
        senderId: { $ne: new Types.ObjectId(readerUserId) },
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      }
    ).exec();

    return { modifiedCount: res.modifiedCount };
  }

  async countUnread(conversationId: string, userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(conversationId) || !Types.ObjectId.isValid(userId)) {
      return 0;
    }

    return MessageModel.countDocuments({
      conversationId: new Types.ObjectId(conversationId),
      senderId: { $ne: new Types.ObjectId(userId) },
      readAt: null,
    }).exec();
  }
}

export const messageRepository = new MessageRepository();
