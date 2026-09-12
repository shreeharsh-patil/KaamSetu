import { Types, ClientSession, FilterQuery } from 'mongoose';
import { ReportModel, toReportEntity, IReportDocument } from './report.model.js';
import type {
  IReportEntity,
  ICreateReportInput,
  IUpdateReportInput,
  ListReportsFilters,
  CursorPage,
} from '@kaamsetu/types';

export interface IReportRepository {
  create(data: ICreateReportInput, session?: ClientSession): Promise<IReportEntity>;
  findById(id: string): Promise<IReportEntity | null>;
  listReportsCursor(filters: ListReportsFilters): Promise<CursorPage<IReportEntity>>;
  updateReport(
    id: string,
    data: IUpdateReportInput,
    session?: ClientSession
  ): Promise<IReportEntity | null>;
}

export class ReportRepository implements IReportRepository {
  async create(data: ICreateReportInput, session?: ClientSession): Promise<IReportEntity> {
    const docs = await ReportModel.create(
      [
        {
          reporterId: new Types.ObjectId(data.reporterId),
          targetType: data.targetType,
          targetId: data.targetId,
          reason: data.reason,
          description: data.description.trim(),
          evidence: data.evidence ?? undefined,
        },
      ],
      { session }
    );

    return toReportEntity(docs[0]!);
  }

  async findById(id: string): Promise<IReportEntity | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await ReportModel.findById(id).exec();
    return doc ? toReportEntity(doc) : null;
  }

  async listReportsCursor(filters: ListReportsFilters): Promise<CursorPage<IReportEntity>> {
    const limit = Math.min(Math.max(1, filters.limit ?? 20), 50);
    const query: FilterQuery<IReportDocument> = {};

    if (filters.reporterId && Types.ObjectId.isValid(filters.reporterId)) {
      query.reporterId = new Types.ObjectId(filters.reporterId);
    }
    if (filters.targetType) {
      query.targetType = filters.targetType;
    }
    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(filters.cursor, 'base64url').toString('utf8')
        ) as { createdAt: string; id: string };

        const cursorDate = new Date(decoded.createdAt);
        const cursorId = new Types.ObjectId(decoded.id);

        query.$or = [
          { createdAt: { $lt: cursorDate } },
          { createdAt: cursorDate, _id: { $lt: cursorId } },
        ];
      } catch {
        // Fallback to first page
      }
    }

    const docs = await ReportModel.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit + 1)
      .exec();

    const hasMore = docs.length > limit;
    if (hasMore) {
      docs.pop();
    }

    let nextCursor: string | null = null;
    if (hasMore && docs.length > 0) {
      const last = docs[docs.length - 1];
      if (last) {
        nextCursor = Buffer.from(
          JSON.stringify({
            createdAt: last.createdAt.toISOString(),
            id: last._id.toString(),
          })
        ).toString('base64url');
      }
    }

    return {
      items: docs.map(toReportEntity),
      nextCursor,
      hasMore,
    };
  }

  async updateReport(
    id: string,
    data: IUpdateReportInput,
    session?: ClientSession
  ): Promise<IReportEntity | null> {
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(data.resolvedBy)) return null;

    const doc = await ReportModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: data.status,
          resolutionNotes: data.resolutionNotes ?? null,
          resolvedBy: new Types.ObjectId(data.resolvedBy),
          resolvedAt: new Date(),
        },
      },
      { new: true, session }
    ).exec();

    return doc ? toReportEntity(doc) : null;
  }
}

export const reportRepository = new ReportRepository();
