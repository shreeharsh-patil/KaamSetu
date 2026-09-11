import { app } from './app.js';
import { env, logger, APP_CONFIG } from './config/index.js';
import { connectMongoDB } from './database/mongodb.js';
import { connectRedis } from './database/redis.js';
import { setupGracefulShutdown } from './utils/graceful-shutdown.js';

async function bootstrap(): Promise<void> {
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
      'MongoDB initial connection failed'
    );
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // 2. Connect to Redis
  try {
    await connectRedis(env.REDIS_URL);
  } catch (error) {
    logger.fatal(
      { err: error instanceof Error ? error.message : String(error) },
      'Redis initial connection failed'
    );
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // 3. Start HTTP Server
  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        url: `http://localhost:${env.PORT}`,
        healthCheck: `http://localhost:${env.PORT}/health`,
        readyCheck: `http://localhost:${env.PORT}/ready`,
        apiPrefix: env.API_PREFIX,
      },
      `🚀 ${APP_CONFIG.name} is running and listening on port ${env.PORT}`
    );
  });

  // 4. Setup graceful shutdown handlers
  setupGracefulShutdown(server);
}

// Execute bootstrap
bootstrap().catch((error) => {
  logger.fatal({ err: error instanceof Error ? error.message : String(error) }, 'Fatal bootstrap failure');
  process.exit(1);
});
