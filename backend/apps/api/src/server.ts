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

  logger.info(
    {
      version: APP_CONFIG.version,
      env: env.NODE_ENV,
      port: env.PORT,
    },
    'Starting KaamSetu API server...'
  );

  // 1. Connect to MongoDB
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

  // 2. Connect to Redis
  try {
    await connectRedis(env.REDIS_URL);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (env.NODE_ENV === 'production') {
      logger.fatal(
        { err: message },
        'Redis initial connection failed - Cannot start server without cache'
      );
      process.exit(1);
    }
    logger.warn(
      { err: message },
      'Redis unavailable; starting API with development fallbacks'
    );
  }

  // 3. Create HTTP Server & Initialize Socket.IO Realtime Gateway
  const httpServer = http.createServer(app);
  realtimeGateway.initialize(httpServer, env.CORS_ORIGINS);

  httpServer.listen(env.PORT, () => {
    logger.info(
      {
        url: `http://localhost:${env.PORT}`,
        healthCheck: `http://localhost:${env.PORT}/health`,
        readyCheck: `http://localhost:${env.PORT}/ready`,
        metricsEndpoint: `http://localhost:${env.PORT}/metrics`,
        apiPrefix: env.API_PREFIX,
      },
      `🚀 ${APP_CONFIG.name} is running and listening on port ${env.PORT}`
    );
  });

  // 4. Setup graceful shutdown handlers
  setupGracefulShutdown(httpServer);
}

// Execute bootstrap
bootstrap().catch((error) => {
  logger.fatal({ err: error instanceof Error ? error.message : String(error) }, 'Fatal bootstrap failure');
  process.exit(1);
});
