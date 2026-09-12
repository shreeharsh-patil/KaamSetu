import http from 'http';
import { app } from './app.js';
import { env, logger, APP_CONFIG } from './config/index.js';
import { connectMongoDB } from './database/mongodb.js';
import { connectRedis } from './database/redis.js';
import { realtimeGateway } from './realtime/index.js';
import { setupGracefulShutdown } from './utils/graceful-shutdown.js';
import { sentryService } from './observability/sentry.service.js';

async function bootstrap(): Promise<void> {
  // 0. Initialize Sentry error tracking
  sentryService.init();

  // Structured boot diagnostics (never log secrets or credentials)
  logger.info(
    {
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        pid: process.pid,
      },
      app: {
        name: APP_CONFIG.name,
        version: APP_CONFIG.version,
        environment: env.NODE_ENV,
        port: env.PORT,
        apiPrefix: env.API_PREFIX,
      },
      dependencies: {
        mongoConfigured: Boolean(env.MONGODB_URI),
        redisConfigured: Boolean(env.REDIS_URL),
        requireRedis: env.REQUIRE_REDIS,
        storageProvider: env.STORAGE_PROVIDER,
      },
      security: {
        corsOriginsCount: env.CORS_ORIGINS.length,
        corsOrigins: env.CORS_ORIGINS,
      },
    },
    'Starting KaamSetu API server...'
  );

  // 1. Connect to MongoDB (Primary database - required for API operation)
  try {
    await connectMongoDB({
      uri: env.MONGODB_URI,
    });
  } catch (error) {
    logger.fatal(
      { err: error instanceof Error ? error.message : String(error) },
      'MongoDB initial connection failed - Cannot start server without database'
    );
    process.exit(1);
  }

  // 2. Connect to Redis (Key-value cache, rate limiter & message broker)
  try {
    await connectRedis(env.REDIS_URL);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    if (env.REQUIRE_REDIS) {
      logger.fatal(
        { err: message },
        'Redis initial connection failed and REQUIRE_REDIS is enabled - Halting server startup'
      );
      process.exit(1);
    }

    logger.warn(
      {
        err: message,
        impact:
          'Distributed rate-limiting will fallback to in-memory, BullMQ worker queues will be inactive, and caching will be bypassed until Redis connection recovers.',
      },
      'Redis unavailable at startup; proceeding with degraded capabilities in demo/free mode'
    );
  }

  // 3. Create HTTP Server & Initialize Socket.IO Realtime Gateway
  const httpServer = http.createServer(app);
  realtimeGateway.initialize(httpServer, env.CORS_ORIGINS);

  // Bind to 0.0.0.0 and port assigned by Render/host
  httpServer.listen(env.PORT, '0.0.0.0', () => {
    logger.info(
      {
        port: env.PORT,
        host: '0.0.0.0',
        healthCheck: `http://0.0.0.0:${env.PORT}/health`,
        readyCheck: `http://0.0.0.0:${env.PORT}/ready`,
        metricsEndpoint: `http://0.0.0.0:${env.PORT}/metrics`,
        apiPrefix: env.API_PREFIX,
      },
      `🚀 ${APP_CONFIG.name} is running and listening on 0.0.0.0:${env.PORT}`
    );
  });

  // 4. Setup graceful shutdown handlers
  setupGracefulShutdown(httpServer);
}

// Execute bootstrap
bootstrap().catch((error) => {
  logger.fatal(
    { err: error instanceof Error ? error.message : String(error) },
    'Fatal bootstrap failure'
  );
  process.exit(1);
});
