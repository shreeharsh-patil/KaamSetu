import { ClientSession, Types } from 'mongoose';
import {
  SessionModel,
  mapSessionDocumentToEntity,
  ISessionDocument,
} from './session.model.js';
import type {
  ISessionEntity,
  ICreateSessionInput,
  IUpdateSessionInput,
} from '@kaamsetu/types';
import { randomUUID } from 'crypto';

export interface ISessionRepository {
  findById(id: string): Promise<ISessionEntity | null>;
  findRawById(id: string): Promise<ISessionDocument | null>;
  findActiveByUserId(userId: string, currentSessionId?: string): Promise<ISessionEntity[]>;
  findByFamilyId(familyId: string): Promise<ISessionEntity[]>;
  create(data: ICreateSessionInput, session?: ClientSession | null): Promise<ISessionEntity>;
  update(id: string, data: IUpdateSessionInput): Promise<ISessionEntity | null>;
  revoke(id: string): Promise<boolean>;
  revokeAllForUser(userId: string): Promise<number>;
  revokeFamily(familyId: string): Promise<number>;
}

export class SessionRepository implements ISessionRepository {
  async findById(id: string): Promise<ISessionEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await SessionModel.findById(id).exec();
    return doc ? mapSessionDocumentToEntity(doc) : null;
  }

  async findRawById(id: string): Promise<ISessionDocument | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return SessionModel.findById(id).exec();
  }

  async findActiveByUserId(
    userId: string,
    currentSessionId?: string
  ): Promise<ISessionEntity[]> {
    if (!Types.ObjectId.isValid(userId)) return [];

    const now = new Date();
    const docs = await SessionModel.find({
      userId: new Types.ObjectId(userId),
      revokedAt: null,
      expiresAt: { $gt: now },
    })
      .sort({ lastUsedAt: -1 })
      .exec();

    return docs.map((doc) => mapSessionDocumentToEntity(doc, currentSessionId));
  }

  async findByFamilyId(familyId: string): Promise<ISessionEntity[]> {
    const docs = await SessionModel.find({ familyId }).exec();
    return docs.map((doc) => mapSessionDocumentToEntity(doc));
  }

  async create(
    data: ICreateSessionInput,
    session?: ClientSession | null
  ): Promise<ISessionEntity> {
    const doc = new SessionModel({
      userId: new Types.ObjectId(data.userId),
      refreshTokenHash: data.refreshTokenHash,
      familyId: data.familyId || randomUUID(),
      deviceName: data.deviceName ?? null,
      ipAddress: data.ipAddress ?? null,
      userAgent: data.userAgent ?? null,
      expiresAt: data.expiresAt,
      lastUsedAt: new Date(),
      revokedAt: null,
    });

    await doc.save({ session: session ?? undefined });
    return mapSessionDocumentToEntity(doc);
  }

  async update(id: string, data: IUpdateSessionInput): Promise<ISessionEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;

    const doc = await SessionModel.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true }
    ).exec();

    return doc ? mapSessionDocumentToEntity(doc) : null;
  }

  async revoke(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;

    const res = await SessionModel.updateOne(
      { _id: id, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    ).exec();

    return res.modifiedCount > 0;
  }

  async revokeAllForUser(userId: string): Promise<number> {
    if (!Types.ObjectId.isValid(userId)) return 0;

    const res = await SessionModel.updateMany(
      { userId: new Types.ObjectId(userId), revokedAt: null },
      { $set: { revokedAt: new Date() } }
    ).exec();

    return res.modifiedCount;
  }

  async revokeFamily(familyId: string): Promise<number> {
    const res = await SessionModel.updateMany(
      { familyId, revokedAt: null },
      { $set: { revokedAt: new Date() } }
    ).exec();

    return res.modifiedCount;
  }
}

export const sessionRepository = new SessionRepository();
