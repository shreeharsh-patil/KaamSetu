import type { Server } from 'http';
import { logger } from '../config/index.js';
import { disconnectMongoDB } from '../database/mongodb.js';
import { disconnectRedis } from '../database/redis.js';

let isShuttingDown = false;

export function setupGracefulShutdown(server: Server): void {
  const shutdown = async (signal: string, exitCode = 0): Promise<void> => {
    if (isShuttingDown) {
      logger.warn(`Shutdown already in progress, ignoring signal: ${signal}`);
      return;
    }
    isShuttingDown = true;

    logger.info(`Received ${signal}. Initiating graceful shutdown...`);

    // Force exit if shutdown hangs beyond 10 seconds
    const forceExitTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timed out after 10s, forcing process exit');
      process.exit(1);
    }, 10000);

    forceExitTimeout.unref();

    try {
      // 1. Close Realtime Socket.IO gateway and notification queues
      const { realtimeGateway } = await import('../realtime/index.js');
      await realtimeGateway.close();

      const { notificationQueue } = await import('../modules/notifications/index.js');
      await notificationQueue.close();

      const { matchingWorker } = await import('../modules/matching/queue/matching.worker.js');
      await matchingWorker.close();

      const { matchingQueue } = await import('../modules/matching/queue/matching.queue.js');
      await matchingQueue.close();

      // 2. Stop receiving new HTTP connections
      await new Promise<void>((resolve, reject) => {
        server.close((err) => {
          if (err) {
            logger.error({ err: err.message }, 'Error closing HTTP server');
            return reject(err);
          }
          logger.info('HTTP server closed successfully');
          resolve();
        });
      });

      // 3. Disconnect from databases and queues
      await disconnectMongoDB();
      await disconnectRedis();

      logger.info('All resources released. Process exiting cleanly.');
      process.exit(exitCode);
    } catch (error) {
      logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  // Process termination signals
  process.on('SIGTERM', () => {
    void shutdown('SIGTERM', 0);
  });

  process.on('SIGINT', () => {
    void shutdown('SIGINT', 0);
  });

  // Process error safety nets
  process.on('uncaughtException', (err: Error) => {
    logger.fatal({ err: { message: err.message, stack: err.stack } }, 'Uncaught Exception detected!');
    void shutdown('uncaughtException', 1);
  });

  process.on('unhandledRejection', (reason: unknown) => {
    logger.fatal({ reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason }, 'Unhandled Rejection detected!');
    void shutdown('unhandledRejection', 1);
  });
}
