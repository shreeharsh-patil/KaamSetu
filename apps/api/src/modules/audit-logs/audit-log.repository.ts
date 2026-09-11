import { Types, ClientSession } from 'mongoose';
import { AuditLogModel, toAuditLogEntity } from './audit-log.model.js';
import type { IAuditLogEntity, ICreateAuditLogInput } from '@kaamsetu/types';

export interface IAuditLogRepository {
  create(data: ICreateAuditLogInput, session?: ClientSession): Promise<IAuditLogEntity>;
  findByTarget(targetType: string, targetId: string): Promise<IAuditLogEntity[]>;
}

export class AuditLogRepository implements IAuditLogRepository {
  async create(data: ICreateAuditLogInput, session?: ClientSession): Promise<IAuditLogEntity> {
    const docs = await AuditLogModel.create(
      [
        {
          actorId: new Types.ObjectId(data.actorId),
          actorRole: data.actorRole,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          details: data.details,
          createdAt: new Date(),
        },
      ],
      { session }
    );

    return toAuditLogEntity(docs[0]!);
  }

  async findByTarget(targetType: string, targetId: string): Promise<IAuditLogEntity[]> {
    const docs = await AuditLogModel.find({ targetType, targetId })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map(toAuditLogEntity);
  }
}

export const auditLogRepository = new AuditLogRepository();
