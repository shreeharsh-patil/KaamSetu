import { Router } from 'express';
import { healthRoutes } from '../modules/health/health.routes.js';
import { authRoutes } from '../modules/auth/auth.routes.js';
import { workerRoutes } from '../modules/worker-profiles/worker-profile.routes.js';
import { customerRoutes } from '../modules/customer-profiles/customer-profile.routes.js';
import { jobRoutes } from '../modules/jobs/job.routes.js';
import { offerRoutes } from '../modules/job-offers/job-offer.routes.js';
import { getWorkerOffers } from '../modules/job-offers/job-offer.controller.js';
import { conversationRoutes } from '../modules/conversations/conversation.routes.js';
import { messageRoutes } from '../modules/messages/message.routes.js';
import { notificationRoutes } from '../modules/notifications/notification.routes.js';
import { expenseRoutes } from '../modules/expenses/expense.routes.js';
import { earningsRoutes } from '../modules/earnings/earnings.routes.js';
import { transactionRoutes } from '../modules/transactions/transaction.routes.js';
import { reviewRoutes } from '../modules/reviews/review.routes.js';
import { verificationRoutes } from '../modules/verification/verification.routes.js';
import { reportRoutes } from '../modules/reports/report.routes.js';
import { disputeRoutes } from '../modules/disputes/dispute.routes.js';
import { authenticate, requireRole } from '../middlewares/auth.middleware.js';
import { asyncHandler } from '../utils/async-handler.js';
import { UserRole } from '@kaamsetu/types';
import { env } from '../config/index.js';

export function createApiRouter(): Router {
  const router = Router();

  // Root level health endpoints (used by Docker, Kubernetes, AWS ALB, ECS)
  router.use('/', healthRoutes);

  // API version namespace (/api/v1)
  const apiV1Router = Router();

  // Health check under /api/v1/health
  apiV1Router.use('/', healthRoutes);

  // Auth endpoints under /api/v1/auth
  apiV1Router.use('/auth', authRoutes);

  // Worker profile endpoints under /api/v1/workers
  apiV1Router.use('/workers', workerRoutes);

  // Customer profile endpoints under /api/v1/customers
  apiV1Router.use('/customers', customerRoutes);

  // Job lifecycle endpoints under /api/v1/jobs (Phase 4)
  apiV1Router.use('/jobs', jobRoutes);

  // Worker offers list endpoint under /api/v1/worker/offers (Phase 5)
  apiV1Router.get(
    '/worker/offers',
    authenticate(),
    requireRole(UserRole.WORKER, UserRole.ADMIN),
    asyncHandler(getWorkerOffers)
  );

  // Job offer endpoints under /api/v1/offers (Phase 5)
  apiV1Router.use('/offers', offerRoutes);

  // Conversation endpoints under /api/v1 (e.g. /jobs/:jobId/conversation) (Phase 7)
  apiV1Router.use('/', conversationRoutes);

  // Message endpoints under /api/v1/conversations (Phase 7)
  apiV1Router.use('/conversations', messageRoutes);

  // Notification endpoints under /api/v1/notifications (Phase 7)
  apiV1Router.use('/notifications', notificationRoutes);

  // Expense endpoints under /api/v1/expenses (Phase 8)
  apiV1Router.use('/expenses', expenseRoutes);

  // Earnings endpoints under /api/v1/earnings (Phase 8)
  apiV1Router.use('/earnings', earningsRoutes);

  // Financial ledger transaction endpoints under /api/v1/transactions (Phase 8)
  apiV1Router.use('/transactions', transactionRoutes);

  // Reviews endpoints under /api/v1/reviews (Phase 9)
  apiV1Router.use('/reviews', reviewRoutes);

  // Worker verification endpoints under /api/v1/verification (Phase 9)
  apiV1Router.use('/verification', verificationRoutes);

  // Trust & safety report endpoints under /api/v1/reports (Phase 9)
  apiV1Router.use('/reports', reportRoutes);

  // Job disputes endpoints under /api/v1/disputes (Phase 9)
  apiV1Router.use('/disputes', disputeRoutes);

  // Mount API version router
  router.use(env.API_PREFIX, apiV1Router);

  return router;
}
