import { Schema, model, Document, Types } from 'mongoose';
import { MessageType, type IMessageEntity, type IMessageAttachment } from '@kaamsetu/types';

export interface IMessageDocument extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: MessageType;
  content: string;
  attachment?: IMessageAttachment | null;
  readAt?: Date | null;
  createdAt: Date;
}

const messageAttachmentSubSchema = new Schema(
  {
    key: { type: String, trim: true, default: undefined },
    url: { type: String, trim: true, default: undefined },
    mimeType: { type: String, trim: true, default: undefined },
    width: { type: Number, default: undefined },
    height: { type: Number, default: undefined },
    sizeBytes: { type: Number, default: undefined },
    coordinates: {
      type: [Number], // [lng, lat]
      default: undefined,
    },
    address: { type: String, trim: true, default: undefined },
  },
  { _id: false }
);

const messageSchema = new Schema(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(MessageType),
      default: MessageType.TEXT,
      required: true,
    },
    content: {
      type: String,
      trim: true,
      default: '',
    },
    attachment: {
      type: messageAttachmentSubSchema,
      default: undefined,
    },
    readAt: {
      type: Date,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1, readAt: 1 });

export function toMessageEntity(doc: IMessageDocument): IMessageEntity {
  return {
    id: doc._id.toString(),
    conversationId: doc.conversationId.toString(),
    senderId: doc.senderId.toString(),
    type: doc.type,
    content: doc.content ?? '',
    attachment: doc.attachment ?? undefined,
    readAt: doc.readAt ?? null,
    createdAt: doc.createdAt,
  };
}

export const MessageModel = model<IMessageDocument>(
  'Message',
  messageSchema,
  'messages'
);
