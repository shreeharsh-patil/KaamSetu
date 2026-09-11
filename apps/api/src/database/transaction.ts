import mongoose, { ClientSession } from 'mongoose';
import { logger } from '../config/index.js';

/**
 * Executes an operation inside a MongoDB transaction with automatic commit/abort and retry logic.
 * Gracefully falls back to non-transactional execution on standalone MongoDB instances (e.g. in local development).
 */
export async function withTransaction<T>(
  operation: (session: ClientSession | null) => Promise<T>
): Promise<T> {
  let session: ClientSession | null = null;

  try {
    session = await mongoose.startSession();
  } catch (err) {
    logger.warn({ err: err instanceof Error ? err.message : String(err) }, 'Sessions not supported, running without session');
    return operation(null);
  }

  try {
    let result: T | undefined;
    await session.withTransaction(async () => {
      result = await operation(session);
    });
    return result as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // Standalone MongoDB does not support transactions
    if (
      message.includes('replica set') ||
      message.includes('Transaction numbers are only allowed on a replica set member')
    ) {
      logger.warn('MongoDB instance is standalone (no replica set). Falling back to non-transactional execution.');
      return operation(null);
    }
    throw error;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
