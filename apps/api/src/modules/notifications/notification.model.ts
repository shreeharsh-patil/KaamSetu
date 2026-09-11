import { Schema, model, Document, Types } from 'mongoose';
import {
  NotificationChannel,
  NotificationType,
  type INotificationEntity,
} from '@kaamsetu/types';

export interface INotificationDocument extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  readAt?: Date | null;
  deliveredAt?: Date | null;
  failedAt?: Date | null;
  failureReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      index: true,
    },
    channel: {
      type: String,
      enum: Object.values(NotificationChannel),
      default: NotificationChannel.IN_APP,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 200,
    },
    body: {
      type: String,
      required: [true, 'Body is required'],
      trim: true,
      maxlength: 1000,
    },
    data: {
      type: Schema.Types.Mixed,
      default: undefined,
    },
    readAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    failedAt: {
      type: Date,
      default: null,
    },
    failureReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });
notificationSchema.index({ channel: 1, deliveredAt: 1 });

export function toNotificationEntity(doc: INotificationDocument): INotificationEntity {
  return {
    id: doc._id.toString(),
    userId: doc.userId.toString(),
    type: doc.type as NotificationType,
    channel: doc.channel,
    title: doc.title,
    body: doc.body,
    data: doc.data,
    readAt: doc.readAt ?? null,
    deliveredAt: doc.deliveredAt ?? null,
    failedAt: doc.failedAt ?? null,
    failureReason: doc.failureReason ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const NotificationModel = model<INotificationDocument>(
  'Notification',
  notificationSchema,
  'notifications'
);
