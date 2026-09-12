import { JobStatus } from '@kaamsetu/types';
import { env, logger } from '../config/index.js';
import { connectMongoDB, disconnectMongoDB } from '../database/mongodb.js';
import { JobModel } from '../modules/jobs/job.model.js';
import { matchingService } from '../modules/matching/matching.service.js';

export async function repairStuckMatchingJobs(): Promise<{
  scanned: number;
  repaired: number;
}> {
  logger.info('Starting stuck matching repair routine...');

  const now = new Date();
  const ninetySecondsAgo = new Date(Date.now() - 90 * 1000);

  // Find unassigned jobs in MATCHING or OFFERED state that exceeded the window
  const query = {
    status: { $in: [JobStatus.MATCHING, JobStatus.OFFERED] },
    assignedWorkerId: null,
    $or: [
      { matchingExpiresAt: { $ne: null, $lte: now } },
      { matchingExpiresAt: null, createdAt: { $lte: ninetySecondsAgo } },
    ],
  };

  const stuckJobs = await JobModel.find(query).exec();
  logger.info({ count: stuckJobs.length }, 'Found candidate stuck matching jobs to expire');

  let repaired = 0;
  for (const doc of stuckJobs) {
    try {
      const jobId = doc._id.toString();
      logger.info(
        { jobId, status: doc.status, createdAt: doc.createdAt, matchingExpiresAt: doc.matchingExpiresAt },
        'Expiring stuck matching job'
      );
      await matchingService.expireMatchingJob(jobId, 'STUCK_MATCHING_MAINTENANCE_REPAIR');
      repaired++;
    } catch (err) {
      logger.error(
        { jobId: doc._id.toString(), err: err instanceof Error ? err.message : String(err) },
        'Failed to cleanly expire stuck job'
      );
    }
  }

  logger.info({ scanned: stuckJobs.length, repaired }, 'Stuck matching repair routine complete');
  return { scanned: stuckJobs.length, repaired };
}

async function main(): Promise<void> {
  try {
    await connectMongoDB({ uri: env.MONGODB_URI });
    await repairStuckMatchingJobs();
    await disconnectMongoDB();
    process.exit(0);
  } catch (err) {
    logger.fatal({ err: err instanceof Error ? err.message : String(err) }, 'Repair routine failed');
    process.exit(1);
  }
}

// Run directly when called via CLI
if (process.argv[1]?.includes('repair-stuck-matching')) {
  void main();
}
