import mongoose from 'mongoose';
import { logger } from '../config/index.js';
import type { ServiceConnectionStatus } from '@kaamsetu/types';

export interface MongoConfig {
  uri: string;
  maxPoolSize?: number;
  minPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  connectTimeoutMS?: number;
  socketTimeoutMS?: number;
}

const DEFAULT_MAX_POOL_SIZE = 50;
const DEFAULT_MIN_POOL_SIZE = 10;
const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 5000;
const DEFAULT_CONNECT_TIMEOUT_MS = 10000;
const DEFAULT_SOCKET_TIMEOUT_MS = 45000;

export async function connectMongoDB(config: MongoConfig): Promise<typeof mongoose> {
  const {
    uri,
    maxPoolSize = DEFAULT_MAX_POOL_SIZE,
    minPoolSize = DEFAULT_MIN_POOL_SIZE,
    serverSelectionTimeoutMS = DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
    connectTimeoutMS = DEFAULT_CONNECT_TIMEOUT_MS,
    socketTimeoutMS = DEFAULT_SOCKET_TIMEOUT_MS,
  } = config;

  mongoose.connection.on('connected', () => {
    logger.info({ host: mongoose.connection.host }, 'MongoDB connected successfully');
  });

  mongoose.connection.on('error', (err: Error) => {
    logger.error({ err: err.message }, 'MongoDB connection error');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
  });

  try {
    return await mongoose.connect(uri, {
      maxPoolSize,
      minPoolSize,
      serverSelectionTimeoutMS,
      connectTimeoutMS,
      socketTimeoutMS,
      autoIndex: process.env['NODE_ENV'] !== 'production',
    });
  } catch (error) {
    logger.error({ err: error instanceof Error ? error.message : String(error) }, 'Failed to connect to MongoDB');
    throw error;
  }
}

export async function disconnectMongoDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected gracefully');
  }
}

export function isMongoDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export function getMongoDBStatus(): ServiceConnectionStatus {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    default:
      return 'disconnected';
  }
}
