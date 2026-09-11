import { Types } from 'mongoose';
import {
  JobStatus,
  TransactionType,
  type IEarningsSummary,
  type IEarningsJobItem,
  type CursorPage,
} from '@kaamsetu/types';
import type { EarningsSummaryQueryDto } from '@kaamsetu/validation';
import {
  ITransactionRepository,
  transactionRepository,
} from '../transactions/transaction.repository.js';
import {
  IExpenseRepository,
  expenseRepository,
} from '../expenses/expense.repository.js';
import {
  IJobEventRepository,
  jobEventRepository,
} from '../job-events/job-event.repository.js';
import { JobModel } from '../jobs/job.model.js';
import { TransactionModel } from '../transactions/transaction.model.js';
import { BadRequestError } from '../../errors/index.js';

export interface DateRangeBounds {
  startDate: Date;
  endDate: Date;
}

export class EarningsService {
  constructor(
    private readonly transactionRepo: ITransactionRepository = transactionRepository,
    private readonly expenseRepo: IExpenseRepository = expenseRepository,
    private readonly jobEventRepo: IJobEventRepository = jobEventRepository
  ) {}

  /**
   * Helper to resolve start and end dates based on timeRange query.
   */
  resolveDateBounds(
    timeRange: 'today' | 'week' | 'month' | 'custom',
    customStart?: string,
    customEnd?: string
  ): DateRangeBounds {
    const now = new Date();

    if (timeRange === 'today') {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { startDate: start, endDate: end };
    }

    if (timeRange === 'week') {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }

    if (timeRange === 'month') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      return { startDate: start, endDate: now };
    }

    // custom
    const start = customStart ? new Date(customStart) : new Date(0);
    const end = customEnd ? new Date(customEnd) : now;
    return { startDate: start, endDate: end };
  }

  /**
   * Calculate earnings summary for worker over a time window.
   * All monetary values are strictly integer paise. Zero floating-point accumulation.
   */
  async getEarningsSummary(
    workerId: string,
    query: EarningsSummaryQueryDto
  ): Promise<IEarningsSummary> {
    if (!Types.ObjectId.isValid(workerId)) {
      throw new BadRequestError('Invalid worker ID format');
    }

    const { startDate, endDate } = this.resolveDateBounds(
      query.timeRange,
      query.startDate,
      query.endDate
    );

    // Aggregate ledger revenue and logged expenses atomically
    const [grossRevenue, totalExpenses] = await Promise.all([
      this.transactionRepo.aggregateWorkerRevenue(workerId, startDate, endDate),
      this.expenseRepo.aggregateWorkerExpenses(workerId, startDate, endDate),
    ]);

    const netEarnings = grossRevenue - totalExpenses;

    // Query completed jobs for this worker within the date window
    const completedJobs = await JobModel.find({
      assignedWorkerId: new Types.ObjectId(workerId),
      status: JobStatus.COMPLETED,
      updatedAt: { $gte: startDate, $lte: endDate },
      deletedAt: null,
    }).lean();

    const totalJobs = completedJobs.length;

    // Calculate duration in hours per completed job from job events
    let totalDurationHours = 0;
    for (const job of completedJobs) {
      const events = await this.jobEventRepo.findByJobId(job._id.toString());
      const startedEvent = events.find(
        (e) => e.eventType === 'JOB_STARTED' || e.eventType === 'TRAVEL_STARTED' || e.eventType === 'WORKER_ARRIVED'
      );
      const completedEvent = events.find((e) => e.eventType === 'JOB_COMPLETED');

      if (startedEvent && completedEvent) {
        const diffHours =
          (completedEvent.createdAt.getTime() - startedEvent.createdAt.getTime()) /
          (1000 * 60 * 60);
        totalDurationHours += diffHours > 0 ? Math.max(0.05, Math.round(diffHours * 100) / 100) : 1.0;
      } else {
        totalDurationHours += 1.0; // Default baseline 1 hour per completed job
      }
    }

    const hoursWorked = Math.round(totalDurationHours * 100) / 100;
    const earningsPerHour =
      hoursWorked > 0 ? Math.round(netEarnings / hoursWorked) : 0;

    return {
      timeRange: query.timeRange,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      grossRevenue,
      totalExpenses,
      netEarnings,
      totalJobs,
      hoursWorked,
      earningsPerHour,
      currency: 'INR',
    };
  }

  /**
   * List completed jobs for worker with financial breakdown (revenue, expenses, net).
   */
  async getEarningsJobs(
    workerId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<CursorPage<IEarningsJobItem>> {
    if (!Types.ObjectId.isValid(workerId)) {
      throw new BadRequestError('Invalid worker ID format');
    }

    const safeLimit = Math.min(Math.max(1, limit), 50);

    const query: Record<string, unknown> = {
      assignedWorkerId: new Types.ObjectId(workerId),
      status: JobStatus.COMPLETED,
      deletedAt: null,
    };

    if (cursor) {
      try {
        const decoded = JSON.parse(
          Buffer.from(cursor, 'base64url').toString('utf8')
        ) as { updatedAt: string; id: string };

        const cursorDate = new Date(decoded.updatedAt);
        const cursorId = new Types.ObjectId(decoded.id);

        query['$or'] = [
          { updatedAt: { $lt: cursorDate } },
          { updatedAt: cursorDate, _id: { $lt: cursorId } },
        ];
      } catch {
        // Fallback on invalid cursor
      }
    }

    const jobs = await JobModel.find(query)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(safeLimit + 1)
      .lean();

    const hasMore = jobs.length > safeLimit;
    if (hasMore) {
      jobs.pop();
    }

    let nextCursor: string | null = null;
    if (hasMore && jobs.length > 0) {
      const last = jobs[jobs.length - 1];
      if (last) {
        nextCursor = Buffer.from(
          JSON.stringify({
            updatedAt: last.updatedAt.toISOString(),
            id: last._id.toString(),
          })
        ).toString('base64url');
      }
    }

    const items: IEarningsJobItem[] = [];

    for (const job of jobs) {
      const jobIdStr = job._id.toString();

      // Find revenue from ledger
      const revenueTx = await TransactionModel.findOne({
        workerId: new Types.ObjectId(workerId),
        jobId: job._id,
        type: TransactionType.JOB_REVENUE,
      }).lean();

      const revenue = revenueTx
        ? revenueTx.amount
        : Math.round((job.estimatedPrice ?? 0) * 100);

      // Aggregate job-specific expenses
      const expenses = await this.expenseRepo.aggregateWorkerExpenses(
        workerId,
        undefined,
        undefined,
        jobIdStr
      );

      const netEarnings = revenue - expenses;

      // Compute duration
      const events = await this.jobEventRepo.findByJobId(jobIdStr);
      const startedEvent = events.find(
        (e) => e.eventType === 'JOB_STARTED' || e.eventType === 'TRAVEL_STARTED' || e.eventType === 'WORKER_ARRIVED'
      );
      const completedEvent = events.find((e) => e.eventType === 'JOB_COMPLETED');

      let durationHours = 1.0;
      if (startedEvent && completedEvent) {
        const diff =
          (completedEvent.createdAt.getTime() - startedEvent.createdAt.getTime()) /
          (1000 * 60 * 60);
        durationHours = diff > 0 ? Math.max(0.05, Math.round(diff * 100) / 100) : 1.0;
      }

      items.push({
        jobId: jobIdStr,
        title: job.title,
        completedAt: job.updatedAt,
        revenue,
        expenses,
        netEarnings,
        durationHours,
      });
    }

    return {
      items,
      nextCursor,
      hasMore,
    };
  }
}

export const earningsService = new EarningsService();
