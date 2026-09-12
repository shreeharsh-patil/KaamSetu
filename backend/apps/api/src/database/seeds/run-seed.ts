import { env, logger } from '../../config/index.js';
import { connectMongoDB, disconnectMongoDB } from '../mongodb.js';
import { ensureIndexes } from '../indexes.js';
import { seedCategoriesAndSkills } from './index.js';

async function run(): Promise<void> {
  logger.info('Connecting to MongoDB for seeding...');
  await connectMongoDB({ uri: env.MONGODB_URI });

  await ensureIndexes();
  await seedCategoriesAndSkills();

  await disconnectMongoDB();
  logger.info('Database seeding completed successfully');
  process.exit(0);
}

run().catch((err) => {
  logger.fatal({ err: err instanceof Error ? err.message : String(err) }, 'Seeding failed');
  process.exit(1);
});
