import { Schema, model, Document, Types } from 'mongoose';
import type { IConversationEntity } from '@kaamsetu/types';

export interface IConversationDocument extends Document {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  participants: Types.ObjectId[];
  lastMessageAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'Job',
      required: [true, 'Job ID is required'],
      unique: true,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    lastMessageAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ lastMessageAt: -1 });

export function toConversationEntity(doc: IConversationDocument): IConversationEntity {
  return {
    id: doc._id.toString(),
    jobId: doc.jobId.toString(),
    participants: (doc.participants || []).map((p) => p.toString()),
    lastMessageAt: doc.lastMessageAt ?? null,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export const ConversationModel = model<IConversationDocument>(
  'Conversation',
  conversationSchema,
  'conversations'
);
