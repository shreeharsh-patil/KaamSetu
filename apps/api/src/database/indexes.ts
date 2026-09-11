import { UserModel } from '../modules/users/user.model.js';
import { ServiceCategoryModel } from '../modules/service-categories/service-category.model.js';
import { SkillModel } from '../modules/skills/skill.model.js';
import { WorkerProfileModel } from '../modules/worker-profiles/worker-profile.model.js';
import { CustomerProfileModel } from '../modules/customer-profiles/customer-profile.model.js';
import { SessionModel } from '../modules/sessions/session.model.js';
import { JobModel } from '../modules/jobs/job.model.js';
import { JobEventModel } from '../modules/job-events/job-event.model.js';
import { JobOfferModel } from '../modules/job-offers/job-offer.model.js';
import { ConversationModel } from '../modules/conversations/conversation.model.js';
import { MessageModel } from '../modules/messages/message.model.js';
import { NotificationModel } from '../modules/notifications/notification.model.js';
import { logger } from '../config/index.js';

/**
 * Explicitly builds and verifies all critical indexes across collections.
 */
export async function ensureIndexes(): Promise<void> {
  try {
    logger.info('Ensuring database indexes across all models...');

    await Promise.all([
      UserModel.syncIndexes(),
      ServiceCategoryModel.syncIndexes(),
      SkillModel.syncIndexes(),
      WorkerProfileModel.syncIndexes(),
      CustomerProfileModel.syncIndexes(),
      SessionModel.syncIndexes(),
      JobModel.syncIndexes(),
      JobEventModel.syncIndexes(),
      JobOfferModel.syncIndexes(),
      ConversationModel.syncIndexes(),
      MessageModel.syncIndexes(),
      NotificationModel.syncIndexes(),
    ]);

    logger.info('All database indexes synchronized successfully');
  } catch (error) {
    logger.error(
      { err: error instanceof Error ? error.message : String(error) },
      'Failed to synchronize database indexes'
    );
    throw error;
  }
}
