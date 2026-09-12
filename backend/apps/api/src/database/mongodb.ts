import dns from 'node:dns';
import mongoose from 'mongoose';
import { logger } from '../config/index.js';
import type { ServiceConnectionStatus } from '@kaamsetu/types';

// Fix for Node.js / c-ares on Windows when DNS resolver defaults to loopback 127.0.0.1
try {
  const currentServers = dns.getServers();
  if (!currentServers.length || currentServers.every((s) => s === '127.0.0.1' || s === '::1')) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch {
  // ignore
}

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

  // Resolve SRV lookups reliably across environments (e.g. Windows c-ares resolver)
  if (uri.startsWith('mongodb+srv://') || uri.includes('mongodb.net')) {
    try {
      dns.setServers(['8.8.8.8', '1.1.1.1']);
    } catch {
      // Ignore if cannot set servers in current sandbox
    }
  }

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
    case 3:
      return 'disconnected';
    case 0:
    default:
      return 'disconnected';
  }
}
