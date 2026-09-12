import { ClientSession, Types } from 'mongoose';
import { NotificationModel, toNotificationEntity } from './notification.model.js';
import type {
  INotificationEntity,
  ICreateNotificationInput,
} from '@kaamsetu/types';

export interface INotificationRepository {
  create(data: ICreateNotificationInput, session?: ClientSession): Promise<INotificationEntity>;
  findById(id: string): Promise<INotificationEntity | null>;
  findByUserId(userId: string, limit?: number): Promise<INotificationEntity[]>;
  markAsDelivered(id: string): Promise<INotificationEntity | null>;
  markAsFailed(id: string, reason: string): Promise<INotificationEntity | null>;
  markAsRead(id: string, userId: string): Promise<INotificationEntity | null>;
  markAllAsRead(userId: string): Promise<number>;
}

export class NotificationRepository implements INotificationRepository {
  async create(
    data: ICreateNotificationInput,
    session?: ClientSession
  ): Promise<INotificationEntity> {
    const docs = await NotificationModel.create(
      [
        {
          userId: new Types.ObjectId(data.userId),
          type: data.type,
          channel: data.channel,
          title: data.title,
          body: data.body,
          data: data.data,
          readAt: null,
          deliveredAt: null,
          failedAt: null,
          failureReason: null,
        },
      ],
      { session }
    );

    return toNotificationEntity(docs[0]!);
  }

  async findById(id: string): Promise<INotificationEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await NotificationModel.findById(id).exec();
    return doc ? toNotificationEntity(doc) : null;
  }

  async findByUserId(userId: string, limit: number = 50): Promise<INotificationEntity[]> {
    if (!Types.ObjectId.isValid(userId)) return [];
    const docs = await NotificationModel.find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();

    return docs.map(toNotificationEntity);
  }

  async markAsDelivered(id: string): Promise<INotificationEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await NotificationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          deliveredAt: new Date(),
          failedAt: null,
          failureReason: null,
        },
      },
      { new: true }
    ).exec();

    return doc ? toNotificationEntity(doc) : null;
  }

  async markAsFailed(id: string, reason: string): Promise<INotificationEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await NotificationModel.findByIdAndUpdate(
      id,
      {
        $set: {
          failedAt: new Date(),
          failureReason: reason,
        },
      },
      { new: true }
    ).exec();

    return doc ? toNotificationEntity(doc) : null;
  }

  async markAsRead(id: string, userId: string): Promise<INotificationEntity | null> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) return null;
    const doc = await NotificationModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(id),
        userId: new Types.ObjectId(userId),
      },
      {
        $set: { readAt: new Date() },
      },
      { new: true }
    ).exec();

    return doc ? toNotificationEntity(doc) : null;
  }

  async markAllAsRead(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) return 0;
    const res = await NotificationModel.updateMany(
      {
        userId: new Types.ObjectId(userId),
        readAt: null,
      },
      {
        $set: { readAt: new Date() },
      }
    ).exec();

    return res.modifiedCount;
  }
}

export const notificationRepository = new NotificationRepository();
