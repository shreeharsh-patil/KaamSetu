import { Types } from 'mongoose';
import {
  UserRole,
  ReportStatus,
  type IReportEntity,
  type CursorPage,
} from '@kaamsetu/types';
import type {
  CreateReportInputDto,
  UpdateReportInputDto,
  ListReportsQueryDto,
} from '@kaamsetu/validation';
import { IReportRepository, reportRepository } from './report.repository.js';
import { auditLogRepository } from '../audit-logs/audit-log.repository.js';
import {
  NotFoundError,
  ForbiddenError,
  BadRequestError,
} from '../../errors/index.js';

export class ReportService {
  constructor(
    private readonly reportRepo: IReportRepository = reportRepository
  ) {}

  /**
   * Any user can submit a report against a user, job, message, or review.
   */
  async createReport(
    reporterId: string,
    input: CreateReportInputDto
  ): Promise<IReportEntity> {
    if (!Types.ObjectId.isValid(reporterId)) {
      throw new BadRequestError('Invalid reporter ID format');
    }

    return this.reportRepo.create({
      reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      description: input.description,
      evidence: input.evidence,
    });
  }

  /**
   * Admin or Support agent reviews and resolves/dismisses a report.
   * Action creates an audit log for accountability.
   */
  async updateReport(
    resolver: { id: string; role: UserRole },
    reportId: string,
    input: UpdateReportInputDto
  ): Promise<IReportEntity> {
    if (!Types.ObjectId.isValid(reportId)) {
      throw new BadRequestError('Invalid report ID format');
    }

    if (resolver.role !== UserRole.ADMIN && resolver.role !== UserRole.SUPPORT) {
      throw new ForbiddenError('Only Admin or Support staff can update or resolve reports');
    }

    const report = await this.reportRepo.findById(reportId);
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    const updated = await this.reportRepo.updateReport(reportId, {
      status: input.status as ReportStatus,
      resolutionNotes: input.resolutionNotes,
      resolvedBy: resolver.id,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update report');
    }

    // Write audit log
    await auditLogRepository.create({
      actorId: resolver.id,
      actorRole: resolver.role,
      action: `REPORT_${input.status}`,
      targetType: 'REPORT',
      targetId: reportId,
      details: {
        targetType: report.targetType,
        targetId: report.targetId,
        status: input.status,
        resolutionNotes: input.resolutionNotes,
      },
    });

    return updated;
  }

  /**
   * User views reports they submitted.
   */
  async getMyReports(
    reporterId: string,
    query: ListReportsQueryDto
  ): Promise<CursorPage<IReportEntity>> {
    return this.reportRepo.listReportsCursor({
      ...query,
      reporterId,
    });
  }

  /**
   * Admin or Support agent lists all reports.
   */
  async listReports(query: ListReportsQueryDto): Promise<CursorPage<IReportEntity>> {
    return this.reportRepo.listReportsCursor(query);
  }

  /**
   * Get single report.
   */
  async getReportById(id: string): Promise<IReportEntity> {
    const report = await this.reportRepo.findById(id);
    if (!report) {
      throw new NotFoundError('Report not found');
    }
    return report;
  }
}

export const reportService = new ReportService();
