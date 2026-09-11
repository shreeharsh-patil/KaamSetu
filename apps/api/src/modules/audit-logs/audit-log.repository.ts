import { Types, ClientSession, FilterQuery } from 'mongoose';
import { AuditLogModel, toAuditLogEntity, IAuditLogDocument } from './audit-log.model.js';
import { redactSensitiveData } from './redact.util.js';
import type { IAuditLogEntity, ICreateAuditLogInput } from '@kaamsetu/types';

export interface IAuditLogRepository {
  create(data: ICreateAuditLogInput, session?: ClientSession): Promise<IAuditLogEntity>;
  findByTarget(targetType: string, targetId: string): Promise<IAuditLogEntity[]>;
  listAuditLogsCursor(query: {
    actorId?: string;
    action?: string;
    resourceType?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ items: IAuditLogEntity[]; nextCursor: string | null; hasMore: boolean }>;
}

export class AuditLogRepository implements IAuditLogRepository {
  async create(data: ICreateAuditLogInput, session?: ClientSession): Promise<IAuditLogEntity> {
    const resourceType = data.resourceType ?? data.targetType ?? 'UNKNOWN';
    const resourceId = data.resourceId ?? data.targetId ?? 'UNKNOWN';
    const targetType = data.targetType ?? data.resourceType ?? resourceType;
    const targetId = data.targetId ?? data.resourceId ?? resourceId;

    // Strict invariant: Sensitive fields must be redacted before persistence
    const redactedBefore = data.before ? (redactSensitiveData(data.before) as Record<string, unknown>) : null;
    const redactedAfter = data.after ? (redactSensitiveData(data.after) as Record<string, unknown>) : null;
    const redactedDetails = data.details ? (redactSensitiveData(data.details) as Record<string, unknown>) : undefined;

    const docs = await AuditLogModel.create(
      [
        {
          actorId: new Types.ObjectId(data.actorId),
          actorRole: data.actorRole,
          action: data.action,
          resourceType,
          resourceId,
          targetType,
          targetId,
          before: redactedBefore,
          after: redactedAfter,
          ipAddress: data.ipAddress ?? null,
          requestId: data.requestId ?? null,
          details: redactedDetails,
          createdAt: new Date(),
        },
      ],
      { session }
    );

    return toAuditLogEntity(docs[0]!);
  }

  async findByTarget(targetType: string, targetId: string): Promise<IAuditLogEntity[]> {
    const docs = await AuditLogModel.find({
      $or: [
        { targetType, targetId },
        { resourceType: targetType, resourceId: targetId },
      ],
    })
      .sort({ createdAt: -1, _id: -1 })
      .exec();
    return docs.map(toAuditLogEntity);
  }

  async listAuditLogsCursor(query: {
    actorId?: string;
    action?: string;
    resourceType?: string;
    cursor?: string;
    limit?: number;
  }): Promise<{ items: IAuditLogEntity[]; nextCursor: string | null; hasMore: boolean }> {
    const limit = Math.min(Math.max(query.limit ?? 20, 1), 100);
    const filter: FilterQuery<IAuditLogDocument> = {};

    if (query.actorId && Types.ObjectId.isValid(query.actorId)) {
      filter.actorId = new Types.ObjectId(query.actorId);
    }
    if (query.action) {
      filter.action = query.action;
    }
    if (query.resourceType) {
      filter.$or = [
        { resourceType: query.resourceType },
        { targetType: query.resourceType },
      ];
    }

    if (query.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(query.cursor, 'base64url').toString('utf8')
        ) as { id: string; createdAt: string };
        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        filter.$and = [
          ...(filter.$and || []),
          {
            $or: [
              { createdAt: { $lt: cursorDate } },
              { createdAt: cursorDate, _id: { $lt: cursorId } },
            ],
          },
        ];
      } catch {
        // Fall back to first page if cursor is invalid
      }
    }

    const docs = await AuditLogModel.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    const items = hasMore ? docs.slice(0, limit) : docs;

    let nextCursor: string | null = null;
    if (hasMore && items.length > 0) {
      const lastItem = items[items.length - 1]!;
      nextCursor = Buffer.from(
        JSON.stringify({
          id: lastItem._id.toString(),
          createdAt: lastItem.createdAt.toISOString(),
        })
      ).toString('base64url');
    }

    return {
      items: items.map(toAuditLogEntity),
      nextCursor,
      hasMore,
    };
  }
}

export const auditLogRepository = new AuditLogRepository();
