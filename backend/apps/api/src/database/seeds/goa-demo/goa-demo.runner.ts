/**
 * CLI runner for the Goa demo seed.
 *
 *   pnpm seed:goa          → upsert the deterministic demo dataset
 *   pnpm seed:goa:reset    → delete ONLY seed-owned records, then reseed
 *
 * Both refuse to run when NODE_ENV === 'production' (see assertSeedAllowed).
 * Never prints credentials; prints the target database name only.
 */
import { env, logger } from '../../../config/index.js';
import { connectMongoDB, disconnectMongoDB } from '../../../mongodb.js';
import { ensureIndexes } from '../../../indexes.js';
import { seedCategoriesAndSkills } from '../index.js';
import {
  seedGoaDemo,
  resetGoaDemoData,
  describeTargetDatabase,
} from './goa-demo.seed.js';

async function run(): Promise<void> {
  const mode = process.argv[2] ?? 'seed'; // 'seed' | 'reset'
  if (mode !== 'seed' && mode !== 'reset') {
    // eslint-disable-next-line no-console
    console.error(`Unknown mode "${mode}". Use: tsx goa-demo.runner.ts [seed|reset]`);
    process.exit(1);
  }

  // eslint-disable-next-line no-console
  console.log(`Target database: ${describeTargetDatabase()}`);
  // eslint-disable-next-line no-console
  console.log(`Environment: ${env.NODE_ENV}`);

  logger.info('Connecting to MongoDB for Goa demo seeding...');
  await connectMongoDB({ uri: env.MONGODB_URI });
  await ensureIndexes();

  if (mode === 'reset') {
    logger.info('Resetting Goa demo data (seed-owned records only)...');
    await resetGoaDemoData();
    logger.info('Reset complete. Reseeding...');
  }

  // Base categories/skills first so shared slugs always exist even on a fresh DB.
  await seedCategoriesAndSkills();
  const summary = await seedGoaDemo();

  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log('GOA DEMO DATA SEEDED');
  // eslint-disable-next-line no-console
  console.log(`Customers: ${summary.customers}  Workers: ${summary.workers}  Admin: 1`);
  // eslint-disable-next-line no-console
  console.log(`Categories: ${summary.categories}  Skills: ${summary.skills}`);
  // eslint-disable-next-line no-console
  console.log(`Jobs: ${summary.jobs}  Offers: ${summary.offers}`);
  // eslint-disable-next-line no-console
  console.log(`Conversations: ${summary.conversations}  Messages: ${summary.messages}`);
  // eslint-disable-next-line no-console
  console.log(`Reviews: ${summary.reviews}  Expenses: ${summary.expenses}  Notifications: ${summary.notifications}`);
  // eslint-disable-next-line no-console
  console.log('');
  // eslint-disable-next-line no-console
  console.log('Primary demo accounts (OTP 123456 in non-production):');
  // eslint-disable-next-line no-console
  console.log('  Customer: +919900001001 (Demo Customer, Panaji)');
  // eslint-disable-next-line no-console
  console.log('  Worker:   +919900002001 (Demo Plumber, Panaji)');
  // eslint-disable-next-line no-console
  console.log('  Admin:    +919900009001 (Demo Admin)');
  // eslint-disable-next-line no-console
  console.log('');

  await disconnectMongoDB();
  process.exit(0);
}

run().catch((err) => {
  logger.fatal(
    { err: err instanceof Error ? err.message : String(err) },
    'Goa demo seeding failed'
  );
  process.exit(1);
});
