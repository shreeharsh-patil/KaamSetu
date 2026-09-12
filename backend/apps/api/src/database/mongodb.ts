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
const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 10000;
const DEFAULT_CONNECT_TIMEOUT_MS = 15000;
const DEFAULT_SOCKET_TIMEOUT_MS = 45000;

export function sanitizeMongoUri(uri: string): string {
  try {
    return uri.replace(
      /(mongodb(?:\+srv)?:\/\/[^:]+:)([^@]+)@/,
      '$1***@'
    );
  } catch {
    return 'mongodb://[sanitized]';
  }
}

export function categorizeMongoError(err: Error): string {
  const msg = err.message.toLowerCase();
  if (
    msg.includes('enotfound') ||
    msg.includes('querysrv') ||
    msg.includes('dns') ||
    msg.includes('getaddrinfo')
  ) {
    return 'DNS Resolution Failure: Unable to resolve MongoDB Atlas hostname. Check SRV record and container DNS.';
  }
  if (
    msg.includes('auth') ||
    msg.includes('bad auth') ||
    msg.includes('authentication failed') ||
    msg.includes('unauthorized')
  ) {
    return 'Authentication Failure: Invalid MongoDB Atlas username or password. Check MONGODB_URI credentials and authSource.';
  }
  if (
    msg.includes('serverselectiontimeout') ||
    msg.includes('timed out') ||
    msg.includes('etimedout') ||
    msg.includes('econnrefused')
  ) {
    return 'Network Timeout / IP Allowlist Failure: Cannot reach MongoDB cluster. Ensure Render IP or 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.';
  }
  if (
    msg.includes('ssl') ||
    msg.includes('tls') ||
    msg.includes('certificate') ||
    msg.includes('handshake')
  ) {
    return 'TLS/SSL Handshake Failure: TLS handshake failed connecting to MongoDB cluster. Check Node SSL certs or connection options.';
  }
  return `MongoDB Connection Error: ${err.message}`;
}

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
    const err = error instanceof Error ? error : new Error(String(error));
    const diagnosis = categorizeMongoError(err);
    logger.error(
      {
        diagnosis,
        sanitizedUri: sanitizeMongoUri(uri),
        rawError: err.message,
      },
      `Failed to connect to MongoDB: ${diagnosis}`
    );
    throw new Error(`${diagnosis} (Underlying error: ${err.message})`, { cause: error });
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
