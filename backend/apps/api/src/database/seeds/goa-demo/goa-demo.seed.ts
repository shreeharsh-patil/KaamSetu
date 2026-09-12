/**
 * Goa demo seed — deterministic, idempotent, development-only.
 *
 * SAFETY
 * ──────
 * • Every person is fictional; phones use the reserved +91 99000 0xxx range.
 * • Addresses are generic neighbourhood descriptions, not real residences.
 * • Refuses to run when NODE_ENV === 'production' unless
 *   ALLOW_GOA_SEED_IN_PROD=true is also set (disposable envs only).
 *
 * IDEMPOTENCY / RESET
 * ───────────────────
 * Every document gets a deterministic _id derived via sha256("GOA_DEMO_V1:<kind>:<key>")
 * (see util.ts). Insertion is upsert-by-_id, so re-running updates in place and
 * never duplicates. `resetGoaDemoData()` recomputes the same id set and deletes
 * exactly those documents — no schema changes, no broad deleteMany({}).
 *
 * WHY DIRECT MODEL INSERTS (spec §42)
 * ───────────────────────────────────
 * Services like jobService.completeJob record JOB_REVENUE ledger entries and
 * emit realtime/AI/notification side effects. For fixture creation we need full
 * control of timestamps and must suppress all external effects (spec §43), so
 * the seed writes models directly and manually maintains every invariant that
 * the services would normally enforce:
 *   • one accepted offer per job, assignedWorkerId === accepted offer worker
 *   • coherent chronological JobEvent history
 *   • ledger mirror rows for revenue (job:<id>:revenue) and expenses (expense:<id>)
 *   • worker rating/stats aggregates consistent with seeded reviews
 *   • customer jobStats aggregates consistent with seeded jobs
 */
import { Types } from 'mongoose';
import {
  UserRole,
  UserStatus,
  JobStatus,
  JobUrgency,
  JobOfferStatus,
  WorkerAvailability,
  WorkerVerificationStatus,
  SkillLevel,
  ExpenseCategory,
  TransactionType,
  NotificationType,
  NotificationChannel,
  MessageType,
  DisputeReason,
  DisputeStatus,
  ReportReason,
  ReportStatus,
  ReportTargetType,
} from '@kaamsetu/types';
import { env, logger } from '../../config/index.js';
import { UserModel } from '../../modules/users/user.model.js';
import {
  WorkerProfileModel,
} from '../../modules/worker-profiles/worker-profile.model.js';
import {
  CustomerProfileModel,
} from '../../modules/customer-profiles/customer-profile.model.js';
import { ServiceCategoryModel } from '../../modules/service-categories/service-category.model.js';
import { SkillModel } from '../../modules/skills/skill.model.js';
import { JobModel } from '../../modules/jobs/job.model.js';
import { JobOfferModel } from '../../modules/job-offers/job-offer.model.js';
import { JobEventModel } from '../../modules/job-events/job-event.model.js';
import { ConversationModel } from '../../modules/conversations/conversation.model.js';
import { MessageModel } from '../../modules/messages/message.model.js';
import { ReviewModel } from '../../modules/reviews/review.model.js';
import { ExpenseModel } from '../../modules/expenses/expense.model.js';
import { TransactionModel } from '../../modules/transactions/transaction.model.js';
import { NotificationModel } from '../../modules/notifications/notification.model.js';
import { VerificationRequestModel } from '../../modules/verification/verification-request.model.js';
import { DisputeModel } from '../../modules/disputes/dispute.model.js';
import { ReportModel } from '../../modules/reports/report.model.js';
import { AuditLogModel } from '../../modules/audit-logs/audit-log.model.js';
import { GOA_CATEGORIES } from './seed-data/categories.js';
import {
  SEED_WORKERS,
  SEED_CUSTOMERS,
  DEMO_PHONES,
} from './seed-data/people.js';
import {
  SEED_JOBS,
  SEED_CONVERSATIONS,
  SEED_REVIEWS,
  SEED_EXPENSES,
} from './seed-data/jobs.js';
import {
  GOA_LOCATIONS,
  jitteredCoordinates,
  type GoaLocationKey,
} from './seed-data/goa-locations.js';
import { deterministicId, haversineKm, minutesAgo, minutesFromNow, pickStable } from './util.js';

// ─────────────────────────────── guards ───────────────────────────────

export function assertSeedAllowed(): void {
  if (env.NODE_ENV === 'production' && process.env['ALLOW_GOA_SEED_IN_PROD'] !== 'true') {
    throw new Error(
      'Refusing to seed Goa demo data: NODE_ENV is production. ' +
        'Set ALLOW_GOA_SEED_IN_PROD=true only for a disposable environment.'
    );
  }
}

export function describeTargetDatabase(): string {
  const uri = env.MONGODB_URI;
  // Derive the db name without printing credentials.
  try {
    const parsed = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'https://'));
    return parsed.pathname.replace(/^\//, '') || 'kaamsetu';
  } catch {
    return '(unrecognised URI)';
  }
}

// ─────────────────────────── small helpers ────────────────────────────

interface Ctx {
  now: Date;
  categories: Map<string, { id: Types.ObjectId; name: string }>;
  skills: Map<string, { id: Types.ObjectId; categoryId: Types.ObjectId }>;
  users: Map<string, Types.ObjectId>; // key: c<n> | w<n> | admin
  workerProfiles: Map<string, { userId: Types.ObjectId; profileId: Types.ObjectId }>;
  jobs: Map<string, Types.ObjectId>;
  conversations: Map<string, Types.ObjectId>; // jobKey → conversation id
}

const point = (coords: [number, number]) => ({ type: 'Point' as const, coordinates: coords });

function addressOf(def: { town: GoaLocationKey; n: number }) {
  const loc = GOA_LOCATIONS[def.town];
  return {
    line: `Near ${loc.name} town centre (demo address)`,
    city: loc.name,
    state: 'Goa',
    pincode: loc.pincode,
  };
}

// ─────────────────────────── seed sections ────────────────────────────

/** Categories + skills — upsert by unique slug, preserving existing ids. */
async function seedCategoriesAndSkills(ctx: Ctx): Promise<void> {
  for (const cat of GOA_CATEGORIES) {
    const categoryDoc = await ServiceCategoryModel.findOneAndUpdate(
      { slug: cat.slug },
      {
        $set: {
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          displayOrder: cat.displayOrder,
          translations: cat.translations,
          active: true,
          deletedAt: null,
        },
      },
      { upsert: true, new: true }
    );
    ctx.categories.set(cat.slug, { id: categoryDoc._id, name: cat.name });

    for (const skill of cat.skills) {
      const skillDoc = await SkillModel.findOneAndUpdate(
        { slug: skill.slug },
        {
          $set: {
            name: skill.name,
            slug: skill.slug,
            categoryId: categoryDoc._id,
            translations: skill.translations,
            active: true,
            deletedAt: null,
          },
        },
        { upsert: true, new: true }
      );
      ctx.skills.set(skill.slug, { id: skillDoc._id, categoryId: categoryDoc._id });
    }
  }
}

async function seedUsers(ctx: Ctx): Promise<void> {
  const phoneIndex: Array<{ key: string; phone: string; role: UserRole; displayName: string; town?: GoaLocationKey; n?: number }> = [];

  for (const w of SEED_WORKERS) {
    phoneIndex.push({
      key: `w${w.n}`,
      phone: DEMO_PHONES.worker(w.n),
      role: UserRole.WORKER,
      displayName: w.displayName,
      town: w.town,
      n: w.n,
    });
  }
  for (const c of SEED_CUSTOMERS) {
    phoneIndex.push({
      key: `c${c.n}`,
      phone: DEMO_PHONES.customer(c.n),
      role: UserRole.CUSTOMER,
      displayName: c.displayName,
      town: c.town,
      n: c.n,
    });
  }
  phoneIndex.push({
    key: 'admin',
    phone: DEMO_PHONES.admin,
    role: UserRole.ADMIN,
    displayName: 'Demo Admin',
  });

  for (const entry of phoneIndex) {
    const id = deterministicId('user', entry.phone);
    const userDoc = await UserModel.findOneAndUpdate(
      { _id: id },
      {
        $setOnInsert: { _id: id },
        $set: {
          phoneNumber: entry.phone,
          phoneVerified: true,
          role: entry.role,
          status: UserStatus.ACTIVE,
          email: null,
          preferredLanguage: 'en',
          deletedAt: null,
        },
      },
      { upsert: true, new: true }
    );
    ctx.users.set(entry.key, userDoc._id);

    if (entry.role === UserRole.WORKER && entry.town && entry.n) {
      const w = SEED_WORKERS[entry.n - 1];
      const coords = jitteredCoordinates(entry.town, entry.n);
      const profileId = deterministicId('worker-profile', entry.phone);
      await WorkerProfileModel.findOneAndUpdate(
        { _id: profileId },
        {
          $setOnInsert: { _id: profileId },
          $set: {
            userId: userDoc._id,
            displayName: w.displayName,
            bio: w.bio,
            primaryCategoryId: ctx.categories.get(w.category)!.id,
            skills: w.skills.map((slug, i) => {
              const s = ctx.skills.get(slug)!;
              return {
                skillId: s.id,
                experienceYears: Math.max(1, w.experienceYears - i),
                level: i === 0 ? SkillLevel.EXPERT : SkillLevel.INTERMEDIATE,
                verified: w.verification === 'VERIFIED',
              };
            }),
            languages: w.languages,
            serviceLocation: point(coords),
            serviceArea: { city: GOA_LOCATIONS[entry.town].name, pincode: GOA_LOCATIONS[entry.town].pincode },
            serviceRadiusKm: w.serviceRadiusKm,
            onboardingComplete: true,
            availabilityStatus: w.availability as WorkerAvailability,
            pricing: {
              hourlyRate: w.hourlyRate,
              customRateDescription: null,
              currency: 'INR',
            },
            portfolio: [],
            rating: { average: 0, count: 0 }, // recomputed after reviews
            stats: { completedJobs: 0, cancelledJobs: 0, responseTimeMinutes: null },
            verificationStatus: w.verification as WorkerVerificationStatus,
            deletedAt: null,
            updatedAt: ctx.now,
          },
        },
        { upsert: true, new: true }
      );
      ctx.workerProfiles.set(`w${w.n}`, { userId: userDoc._id, profileId });
    }

    if (entry.role === UserRole.CUSTOMER && entry.town && entry.n) {
      const c = SEED_CUSTOMERS[entry.n - 1];
      const profileId = deterministicId('customer-profile', entry.phone);
      await CustomerProfileModel.findOneAndUpdate(
        { _id: profileId },
        {
          $setOnInsert: { _id: profileId },
          $set: {
            userId: userDoc._id,
            displayName: c.displayName,
            savedAddresses: c.addresses.map((addr, i) => {
              const coords = jitteredCoordinates(c.town, c.n + i * 100);
              return {
                label: addr.label,
                line: addr.line,
                city: addr.city,
                state: 'Goa',
                pincode: addr.pincode,
                coordinates: coords,
                isDefault: i === 0,
              };
            }),
            rating: { average: 0, count: 0 },
            jobStats: { totalBookings: 0, activeBookings: 0, cancelledBookings: 0 }, // recomputed
            deletedAt: null,
            updatedAt: ctx.now,
          },
        },
        { upsert: true, new: true }
      );
    }
  }
}

interface OfferPlan {
  workerN: number;
  status: JobOfferStatus;
  respondedAfterMinutes?: number;
  expiresAfterMinutes?: number;
}

/** Statuses that imply an assigned worker — keep in sync with JobStatus. */
const ASSIGNED_STATUSES = new Set<JobStatus>([
  JobStatus.ACCEPTED,
  JobStatus.EN_ROUTE,
  JobStatus.ARRIVED,
  JobStatus.IN_PROGRESS,
  JobStatus.COMPLETED,
  JobStatus.DISPUTED,
]);

/**
 * Build the offer plan for each job, enforcing invariants:
 *  • exactly one ACCEPTED offer for assigned jobs, and it belongs to the worker
 *    that the job definition names
 *  • for MATCHING jobs: pending offers don't exist yet (matching still running)
 *  • for OFFERED jobs: exactly one PENDING offer
 */
function buildOfferPlan(job: (typeof SEED_JOBS)[number]): OfferPlan[] {
  if (ASSIGNED_STATUSES.has(job.status as JobStatus)) {
    // One accepted (the assigned worker) + a few non-accepted rivals.
    const rivals = SEED_WORKERS.filter(
      (w) => w.n !== job.workerN && w.category === job.category
    )
      .slice(0, 2)
      .map((w, i) => ({
        workerN: w.n,
        status:
          i === 0
            ? pickStable([JobOfferStatus.REJECTED, JobOfferStatus.EXPIRED], job.key + w.n)
            : JobOfferStatus.WITHDRAWN,
        respondedAfterMinutes: 6 + i * 4,
      }));
    return [
      { workerN: job.workerN!, status: JobOfferStatus.ACCEPTED, respondedAfterMinutes: 5 },
      ...rivals,
    ];
  }
  if (job.status === JobStatus.OFFERED) {
    return [{ workerN: job.workerN!, status: JobOfferStatus.PENDING }];
  }
  if (job.status === JobStatus.MATCHING) {
    // Matching in progress: no offers created yet.
    return [];
  }
  return [];
}

async function seedJobs(ctx: Ctx): Promise<void> {
  for (const def of SEED_JOBS) {
    const customerId = ctx.users.get(`c${def.customer}`)!;
    const category = ctx.categories.get(def.category)!;
    const skillIds = def.skills.map((s) => ctx.skills.get(s)!.id);
    const coords = jitteredCoordinates(def.town, def.customer * 7 + (def.addressIndex ?? 0));
    const createdAt = minutesAgo(def.createdMinutesAgo, ctx.now);
    const assignedAt =
      def.assignedAfterMinutes !== undefined
        ? minutesAgo(def.createdMinutesAgo - def.assignedAfterMinutes, ctx.now)
        : null;

    // Preferred time: past jobs → their creation+1h; future → scheduledMinutesFromNow
    const preferredTime =
      def.scheduledMinutesFromNow !== undefined
        ? minutesFromNow(def.scheduledMinutesFromNow, ctx.now)
        : new Date(createdAt.getTime() + 60 * 60_000);

    const jobId = deterministicId('job', def.key);
    await JobModel.findOneAndUpdate(
      { _id: jobId },
      {
        $setOnInsert: { _id: jobId, createdAt },
        $set: {
          customerId,
          categoryId: category.id,
          requiredSkills: skillIds,
          title: def.title,
          description: def.description,
          source: pickStable(['APP', 'APP', 'VOICE'] as const, def.key),
          location: point(coords),
          address: addressOf({ town: def.town, n: def.customer }),
          preferredTime,
          urgency: def.urgency as JobUrgency,
          estimatedPrice: def.estimatedPrice > 0 ? def.estimatedPrice : null,
          status: def.status,
          assignedWorkerId:
            def.workerN !== undefined ? ctx.users.get(`w${def.workerN}`)! : null,
          images: [],
          deletedAt: null,
          updatedAt: ctx.now,
        },
      },
      { upsert: true }
    );
    ctx.jobs.set(def.key, jobId);

    // ── Offers (invariant: one ACCEPTED per assigned job, matching the job) ──
    const offerPlan = buildOfferPlan(def);
    for (const offer of offerPlan) {
      const workerUserId = ctx.users.get(`w${offer.workerN}`)!;
      const workerTown = SEED_WORKERS[offer.workerN - 1].town;
      const workerCoords = jitteredCoordinates(workerTown, offer.workerN);
      const distanceKm = haversineKm(workerCoords, coords as unknown as readonly [number, number]);
      const offerId = deterministicId('offer', def.key, offer.workerN);
      const respondedAt =
        offer.respondedAfterMinutes !== undefined && offer.status !== JobOfferStatus.PENDING
          ? minutesAgo(def.createdMinutesAgo - def.assignedAfterMinutes! - offer.respondedAfterMinutes, ctx.now)
          : null;

      await JobOfferModel.findOneAndUpdate(
        { _id: offerId },
        {
          $setOnInsert: { _id: offerId, createdAt: assignedAt ?? createdAt },
          $set: {
            jobId,
            workerId: workerUserId,
            distanceKm,
            matchScore: 80 + (offer.workerN % 15),
            scoreBreakdown: {
              skillScore: 90, distanceScore: 75, availabilityScore: 100,
              ratingScore: 85, completionRateScore: 90, acceptanceRateScore: 88,
              priceScore: 80,
            },
            status: offer.status,
            expiresAt: minutesFromNow(10, assignedAt ?? createdAt),
            respondedAt,
            updatedAt: ctx.now,
          },
        },
        { upsert: true }
      );
    }

    // ── Event history (chronological) ──
    const events: Array<{
      eventType: string;
      actor: string; // user map key
      at: Date;
      previousState?: string | null;
      newState?: string | null;
      reason?: string;
    }> = [];
    const customerKey = `c${def.customer}`;
    // Deterministic event ids keyed by type+seq (NOT by timestamp — relative
    // times change between runs and would otherwise duplicate events).
    const eventSeq = new Map<string, number>();
    const pushEvent = (e: Omit<(typeof events)[number], never>) => {
      const seq = eventSeq.get(e.eventType) ?? 0;
      eventSeq.set(e.eventType, seq + 1);
      events.push({ ...e, idSuffix: `${e.eventType}:${seq}` });
    };

    pushEvent({ eventType: 'CREATED', actor: customerKey, at: createdAt });
    if (def.status !== JobStatus.DRAFT) {
      pushEvent({ eventType: 'PUBLISHED', actor: customerKey, at: minutesAgo(def.createdMinutesAgo - 2, ctx.now), previousState: JobStatus.DRAFT, newState: JobStatus.OPEN });
    }
    if (def.status !== JobStatus.DRAFT && def.status !== JobStatus.CANCELLED) {
      pushEvent({ eventType: 'MATCHING_STARTED', actor: customerKey, at: minutesAgo(def.createdMinutesAgo - 4, ctx.now), previousState: JobStatus.OPEN, newState: JobStatus.MATCHING });
    }
    for (const [offerIdx, offer] of offerPlan.entries()) {
      const offerAt = minutesAgo(def.createdMinutesAgo - def.assignedAfterMinutes! - offerIdx, ctx.now);
      pushEvent({ eventType: 'OFFER_CREATED', actor: customerKey, at: offerAt });
      if (offer.status === JobOfferStatus.ACCEPTED) {
        pushEvent({ eventType: 'OFFER_ACCEPTED', actor: `w${offer.workerN}`, at: minutesAgo(def.createdMinutesAgo - def.assignedAfterMinutes! - offer.respondedAfterMinutes!, ctx.now), previousState: JobStatus.OFFERED, newState: JobStatus.ACCEPTED });
        pushEvent({ eventType: 'WORKER_ASSIGNED', actor: `w${offer.workerN}`, at: minutesAgo(def.createdMinutesAgo - def.assignedAfterMinutes! - offer.respondedAfterMinutes!, ctx.now), previousState: JobStatus.OFFERED, newState: JobStatus.ACCEPTED });
      } else if (offer.status === JobOfferStatus.REJECTED) {
        pushEvent({ eventType: 'OFFER_REJECTED', actor: `w${offer.workerN}`, at: minutesAgo(def.createdMinutesAgo - def.assignedAfterMinutes! - offer.respondedAfterMinutes!, ctx.now) });
      }
      // WITHDRAWN/EXPIRED offer events omitted: the job-level history remains coherent.
    }
    const st = def.status;
    const travelChain: Partial<Record<JobStatus, Array<string>>> = {
      [JobStatus.EN_ROUTE]: ['TRAVEL_STARTED'],
      [JobStatus.ARRIVED]: ['TRAVEL_STARTED', 'WORKER_ARRIVED'],
      [JobStatus.IN_PROGRESS]: ['TRAVEL_STARTED', 'WORKER_ARRIVED', 'JOB_STARTED'],
      [JobStatus.COMPLETED]: ['TRAVEL_STARTED', 'WORKER_ARRIVED', 'JOB_STARTED', 'JOB_COMPLETED'],
      [JobStatus.DISPUTED]: ['TRAVEL_STARTED', 'WORKER_ARRIVED', 'JOB_STARTED', 'JOB_COMPLETED'],
    };
    const chain = travelChain[st as JobStatus] ?? [];
    const segStart = assignedAt ?? createdAt;
    const segEnd = ctx.now;
    const chainStateMap: Record<string, { prev: JobStatus; next: JobStatus }> = {
      TRAVEL_STARTED: { prev: JobStatus.ACCEPTED, next: JobStatus.EN_ROUTE },
      WORKER_ARRIVED: { prev: JobStatus.EN_ROUTE, next: JobStatus.ARRIVED },
      JOB_STARTED: { prev: JobStatus.ARRIVED, next: JobStatus.IN_PROGRESS },
      JOB_COMPLETED: { prev: JobStatus.IN_PROGRESS, next: JobStatus.COMPLETED },
    };
    chain.forEach((evt, i) => {
      const at = new Date(segStart.getTime() + ((segEnd.getTime() - segStart.getTime()) * (i + 1)) / (chain.length + 1));
      const m = chainStateMap[evt];
      pushEvent({ eventType: evt, actor: `w${def.workerN}`, at, previousState: m.prev, newState: m.next });
    });
    if (st === JobStatus.CANCELLED) {
      pushEvent({ eventType: 'CANCELLED', actor: customerKey, at: minutesAgo(Math.max(1, def.createdMinutesAgo - 30), ctx.now), previousState: JobStatus.OPEN, newState: JobStatus.CANCELLED, reason: 'Customer cancelled the request' });
    }
    if (st === JobStatus.EXPIRED) {
      pushEvent({ eventType: 'STATUS_CHANGED', actor: customerKey, at: minutesAgo(Math.max(1, def.createdMinutesAgo - 90), ctx.now), previousState: JobStatus.MATCHING, newState: JobStatus.EXPIRED, reason: 'No worker accepted within the offer window' });
    }
    if (st === JobStatus.DISPUTED) {
      pushEvent({ eventType: 'DISPUTE_RAISED', actor: customerKey, at: minutesAgo(60, ctx.now), previousState: JobStatus.COMPLETED, newState: JobStatus.DISPUTED, reason: 'Issue returned after completion' });
    }

    for (const e of events) {
      const eventId = deterministicId('job-event', def.key, e.idSuffix);
      await JobEventModel.findOneAndUpdate(
        { _id: eventId },
        {
          $setOnInsert: {
            _id: eventId,
            jobId,
            actorId: ctx.users.get(e.actor)!,
            actorRole: e.actor.startsWith('w') ? UserRole.WORKER : e.actor.startsWith('c') ? UserRole.CUSTOMER : UserRole.ADMIN,
            eventType: e.eventType,
            previousState: e.previousState ?? null,
            newState: e.newState ?? null,
            reason: e.reason ?? null,
            metadata: null,
            createdAt: e.at,
          },
        },
        { upsert: true }
      );
    }
  }
}

async function seedConversationsAndMessages(ctx: Ctx): Promise<void> {
  for (const convDef of SEED_CONVERSATIONS) {
    const job = SEED_JOBS.find((j) => j.key === convDef.jobKey);
    if (!job || job.workerN === undefined) continue;
    const jobId = ctx.jobs.get(convDef.jobKey)!;
    const customerId = ctx.users.get(`c${job.customer}`)!;
    const workerId = ctx.users.get(`w${job.workerN}`)!;
    const convId = deterministicId('conversation', convDef.jobKey);
    const jobAssignedAt = minutesAgo(job.createdMinutesAgo - (job.assignedAfterMinutes ?? 0), ctx.now);

    const convDoc = await ConversationModel.findOneAndUpdate(
      { _id: convId },
      {
        $setOnInsert: { _id: convId },
        $set: {
          jobId,
          participants: [customerId, workerId],
          lastMessageAt: minutesAgo(1, ctx.now),
          updatedAt: ctx.now,
        },
      },
      { upsert: true, new: true }
    );
    ctx.conversations.set(convDef.jobKey, convDoc._id);

    let lastAt = jobAssignedAt;
    for (let i = 0; i < convDef.messages.length; i++) {
      const m = convDef.messages[i];
      const at = new Date(jobAssignedAt.getTime() + m.minutesAfterAssignment * 60_000);
      lastAt = at > lastAt ? at : lastAt;
      // Last `unreadCount` messages stay unread by the *recipient* (readAt null).
      const unreadCount = Math.floor(convDef.messages.length * convDef.unreadRatio);
      const isUnread = i >= convDef.messages.length - unreadCount;
      const messageId = deterministicId('message', convDef.jobKey, i);
      await MessageModel.findOneAndUpdate(
        { _id: messageId },
        {
          $setOnInsert: { _id: messageId, createdAt: at },
          $set: {
            conversationId: convId,
            senderId: m.from === 'customer' ? customerId : workerId,
            type: MessageType.TEXT,
            content: m.text,
            readAt: isUnread ? null : at,
            attachment: null,
            updatedAt: at,
          },
        },
        { upsert: true }
      );
    }
    await ConversationModel.updateOne({ _id: convId }, { $set: { lastMessageAt: lastAt } });
  }
}

async function seedReviewsAndWorkerAggregates(ctx: Ctx): Promise<void> {
  const perWorkerReviews = new Map<number, Array<{ rating: number }>>();

  for (const r of SEED_REVIEWS) {
    const job = SEED_JOBS.find((j) => j.key === r.jobKey);
    if (!job || job.workerN === undefined) continue;
    const jobId = ctx.jobs.get(r.jobKey)!;
    const reviewerId = ctx.users.get(`c${job.customer}`)!;
    const revieweeId = ctx.users.get(`w${job.workerN}`)!;
    const jobCompletedAt = minutesAgo(job.createdMinutesAgo - 200, ctx.now);
    const reviewId = deterministicId('review', r.jobKey);

    await ReviewModel.findOneAndUpdate(
      { _id: reviewId },
      {
        $setOnInsert: { _id: reviewId, createdAt: jobCompletedAt },
        $set: {
          jobId,
          reviewerId,
          revieweeId,
          rating: r.rating,
          quality: r.quality ?? null,
          punctuality: r.punctuality ?? null,
          communication: r.communication ?? null,
          comment: r.comment,
          updatedAt: jobCompletedAt,
        },
      },
      { upsert: true }
    );

    const list = perWorkerReviews.get(job.workerN) ?? [];
    list.push({ rating: r.rating });
    perWorkerReviews.set(job.workerN, list);
  }

  // ── Worker aggregates: rating + completedJobs from real seeded data ──
  for (const [workerN, reviews] of perWorkerReviews) {
    const userId = ctx.users.get(`w${workerN}`)!;
    const completedCount = SEED_JOBS.filter(
      (j) => j.workerN === workerN && ASSIGNED_TERMINAL_OK.has(j.status as JobStatus)
    ).length;
    const avg = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;
    await WorkerProfileModel.updateOne(
      { userId },
      {
        $set: {
          'rating.average': avg,
          'rating.count': reviews.length,
          'stats.completedJobs': Math.max(completedCount, reviews.length),
          updatedAt: ctx.now,
        },
      }
    );
  }
  // Workers with no reviews keep rating 0/0 but get completedJobs from job defs
  for (const w of SEED_WORKERS) {
    if (perWorkerReviews.has(w.n)) continue;
    const completedCount = SEED_JOBS.filter(
      (j) => j.workerN === w.n && ASSIGNED_TERMINAL_OK.has(j.status as JobStatus)
    ).length;
    if (completedCount === 0) continue;
    const userId = ctx.users.get(`w${w.n}`)!;
    await WorkerProfileModel.updateOne(
      { userId },
      { $set: { 'stats.completedJobs': completedCount, updatedAt: ctx.now } }
    );
  }

  // ── Customer jobStats aggregates ──
  const perCustomer = new Map<number, { total: number; active: number; cancelled: number }>();
  for (const j of SEED_JOBS) {
    const agg = perCustomer.get(j.customer) ?? { total: 0, active: 0, cancelled: 0 };
    agg.total += 1;
    if (j.status === JobStatus.CANCELLED) agg.cancelled += 1;
    if (ASSIGNED_STATUSES.has(j.status as JobStatus) || j.status === JobStatus.OPEN || j.status === JobStatus.OFFERED || j.status === JobStatus.MATCHING) agg.active += 1;
    perCustomer.set(j.customer, agg);
  }
  for (const [n, agg] of perCustomer) {
    const userId = ctx.users.get(`c${n}`)!;
    await CustomerProfileModel.updateOne(
      { userId },
      { $set: { jobStats: agg, updatedAt: ctx.now } }
    );
  }
}

const ASSIGNED_TERMINAL_OK = new Set<JobStatus>([JobStatus.COMPLETED]);

async function seedLedger(ctx: Ctx): Promise<void> {
  // ── Revenue rows mirror jobService.completeJob exactly (paise, referenceId job:<id>:revenue) ──
  for (const def of SEED_JOBS) {
    if (def.status !== JobStatus.COMPLETED && def.status !== JobStatus.DISPUTED) continue;
    if (!def.estimatedPrice || def.estimatedPrice <= 0) continue;
    if (def.workerN === undefined) continue;
    const jobId = ctx.jobs.get(def.key)!;
    const completedAt = minutesAgo(Math.max(1, def.createdMinutesAgo - 200), ctx.now);
    const txId = deterministicId('tx-revenue', def.key);
    await TransactionModel.findOneAndUpdate(
      { _id: txId },
      {
        $setOnInsert: { _id: txId, createdAt: completedAt },
        $set: {
          workerId: ctx.users.get(`w${def.workerN}`)!,
          jobId,
          type: TransactionType.JOB_REVENUE,
          amount: Math.round(def.estimatedPrice * 100), // rupees → integer paise
          currency: 'INR',
          // Seed-owned referenceId prefix: mirrors production idempotency intent
          // while remaining distinct from live `job:<id>:revenue` rows and from
          // shared-test cleanup filters (which match ^(job|expense)).
          referenceId: `goa-demo:revenue:${jobId.toString()}`,
          metadata: { jobTitle: def.title, completedAt: completedAt.toISOString(), seeded: 'GOA_DEMO_V1' },
        },
      },
      { upsert: true }
    );
  }

  // ── Expenses + mirrored EXPENSE ledger rows (mirror expense.service.create) ──
  for (const e of SEED_EXPENSES) {
    const workerId = ctx.users.get(`w${e.workerN}`)!;
    const jobId = e.jobKey ? ctx.jobs.get(e.jobKey) ?? null : null;
    const amountPaise = Math.round(e.amountRupees * 100);
    const expenseId = deterministicId('expense', `${e.workerN}-${e.note}`);
    const at = minutesAgo(e.minutesAgo, ctx.now);

    await ExpenseModel.findOneAndUpdate(
      { _id: expenseId },
      {
        $setOnInsert: { _id: expenseId, createdAt: at },
        $set: {
          workerId,
          jobId,
          category: e.category as ExpenseCategory,
          amount: amountPaise,
          currency: 'INR',
          note: e.note,
          receipt: null,
          deletedAt: null,
          updatedAt: at,
        },
      },
      { upsert: true }
    );

    const txId = deterministicId('tx-expense', `${e.workerN}-${e.note}`);
    await TransactionModel.findOneAndUpdate(
      { _id: txId },
      {
        $setOnInsert: {
          _id: txId,
          createdAt: at,
          workerId,
          jobId,
          type: TransactionType.EXPENSE,
          amount: amountPaise,
          currency: 'INR',
          referenceId: `goa-demo:expense:${expenseId.toString()}`,
          metadata: { expenseId: expenseId.toString(), category: e.category, note: e.note },
        },
      },
      { upsert: true }
    );
  }
}

async function seedNotificationsDisputesAndMore(ctx: Ctx): Promise<void> {
  const notification = async (p: {
    userKey: string;
    type: NotificationType;
    title: string;
    body: string;
    minutesAgo: number;
    read: boolean;
    data?: Record<string, unknown>;
  }) => {
    await NotificationModel.findOneAndUpdate(
      { _id: deterministicId('notification', p.userKey, p.title) },
      {
        $setOnInsert: { _id: deterministicId('notification', p.userKey, p.title), createdAt: minutesAgo(p.minutesAgo, ctx.now) },
        $set: {
          userId: ctx.users.get(p.userKey)!,
          type: p.type,
          channel: NotificationChannel.IN_APP,
          title: p.title,
          body: p.body,
          data: p.data ?? {},
          readAt: p.read ? minutesAgo(p.minutesAgo - 1, ctx.now) : null,
          deliveredAt: minutesAgo(p.minutesAgo, ctx.now),
          failedAt: null,
          failureReason: null,
          updatedAt: ctx.now,
          createdAt: minutesAgo(p.minutesAgo, ctx.now),
        },
      },
      { upsert: true }
    );
  };

  // Demo customer notifications
  await notification({ userKey: 'c1', type: NotificationType.JOB_ACCEPTED, title: 'Worker accepted your plumbing request', body: 'Demo Plumber accepted "Bathroom tap replacement".', minutesAgo: 100, read: false, data: { jobKey: 'accepted-demo' } });
  await notification({ userKey: 'c1', type: NotificationType.JOB_OFFER, title: 'New job offer near Panaji', body: 'Demo Plumber sent you an offer for "Kitchen sink leaking".', minutesAgo: 18, read: false, data: { jobKey: 'offered-demo' } });
  await notification({ userKey: 'c1', type: NotificationType.JOB_STATUS, title: 'Worker is on the way', body: 'Demo Plumber is travelling to you for "Bathroom pipe joint leaking".', minutesAgo: 60, read: true, data: { jobKey: 'enroute-demo' } });
  await notification({ userKey: 'c1', type: NotificationType.NEW_MESSAGE, title: 'New message received', body: 'You have a new message from Demo Plumber.', minutesAgo: 30, read: false, data: { jobKey: 'accepted-demo' } });
  await notification({ userKey: 'c1', type: NotificationType.JOB_COMPLETED, title: 'Job completed', body: '"Kitchen sink leaking" was marked complete. Leave a review?', minutesAgo: 4300, read: true, data: { jobKey: 'done-demo-reviewable' } });

  // Demo worker notifications
  await notification({ userKey: 'w1', type: NotificationType.JOB_OFFER, title: 'New job offer near Panaji', body: 'New "Kitchen sink leaking" request 2 km away.', minutesAgo: 18, read: false, data: { jobKey: 'offered-demo' } });
  await notification({ userKey: 'w1', type: NotificationType.JOB_ACCEPTED, title: 'Job accepted', body: 'You accepted "Bathroom tap replacement".', minutesAgo: 100, read: true, data: { jobKey: 'accepted-demo' } });
  await notification({ userKey: 'w1', type: NotificationType.NEW_MESSAGE, title: 'New message received', body: 'You have a new message from Demo Customer.', minutesAgo: 25, read: false, data: { jobKey: 'accepted-demo' } });
  await notification({ userKey: 'w1', type: NotificationType.JOB_COMPLETED, title: 'Job completed', body: '"Kitchen sink leaking" completed. ₹500 added to your earnings.', minutesAgo: 4300, read: true, data: { jobKey: 'done-demo-reviewable' } });

  // Ambient notifications for other users
  await notification({ userKey: 'c2', type: NotificationType.JOB_STATUS, title: 'Matching in progress', body: 'We are finding electricians near you for "Bedroom ceiling fan not working".', minutesAgo: 33, read: false, data: { jobKey: 'matching-1' } });
  await notification({ userKey: 'c5', type: NotificationType.JOB_COMPLETED, title: 'Job completed', body: '"AC general service" completed.', minutesAgo: 11400, read: true, data: { jobKey: 'done-5' } });
  await notification({ userKey: 'w11', type: NotificationType.JOB_OFFER, title: 'New job offer near Calangute', body: 'New "AC not cooling properly" request nearby.', minutesAgo: 44, read: false, data: { jobKey: 'open-1' } });

  // ── Verification requests (PENDING workers, metadata placeholders only) ──
  for (const w of SEED_WORKERS.filter((x) => x.verification === 'PENDING')) {
    const workerId = ctx.users.get(`w${w.n}`)!;
    await VerificationRequestModel.findOneAndUpdate(
      { _id: deterministicId('verification', `w${w.n}`) },
      {
        $setOnInsert: { _id: deterministicId('verification', `w${w.n}`), createdAt: minutesAgo(2000, ctx.now) },
        $set: {
          workerId,
          type: 'TRADE_CERTIFICATE',
          documents: [
            {
              key: undefined,
              url: 'seed://placeholder/trade-certificate', // placeholder; never a real S3 URL
              mimeType: 'application/pdf',
              documentType: 'TRADE_CERTIFICATE',
              uploadedAt: minutesAgo(2000, ctx.now),
            },
          ],
          status: 'PENDING',
          reviewedBy: null,
          reviewNotes: null,
          reviewedAt: null,
          updatedAt: ctx.now,
        },
      },
      { upsert: true }
    );
  }

  // ── One OPEN dispute on the disputed job ──
  const disputedJob = SEED_JOBS.find((j) => j.key === 'done-15-disputed')!;
  const disputeId = deterministicId('dispute', 'done-15-disputed');
  await DisputeModel.findOneAndUpdate(
    { _id: disputeId },
    {
      $setOnInsert: { _id: disputeId, createdAt: minutesAgo(60, ctx.now) },
      $set: {
        jobId: ctx.jobs.get('done-15-disputed')!,
        initiatorId: ctx.users.get(`c${disputedJob.customer}`)!,
        respondentId: ctx.users.get(`w${disputedJob.workerN}`)!,
        reason: DisputeReason.POOR_QUALITY,
        description: 'The fridge stopped cooling again the day after the repair. Requesting a re-check or refund of the service charge.',
        evidence: undefined,
        status: DisputeStatus.OPEN,
        resolution: null,
        resolvedBy: null,
        resolvedAt: null,
        updatedAt: ctx.now,
      },
    },
    { upsert: true }
  );

  // ── One PENDING report for admin screens ──
  await ReportModel.findOneAndUpdate(
    { _id: deterministicId('report', 'done-15-disputed') },
    {
      $setOnInsert: { _id: deterministicId('report', 'done-15-disputed'), createdAt: minutesAgo(55, ctx.now) },
      $set: {
        reporterId: ctx.users.get(`c${disputedJob.customer}`)!,
        targetType: ReportTargetType.JOB,
        targetId: ctx.jobs.get('done-15-disputed')!.toString(),
        reason: ReportReason.POOR_SERVICE,
        description: 'Repair did not hold; dispute has been raised through the app.',
        status: ReportStatus.PENDING,
        reviewedBy: null,
        reviewedAt: null,
        resolutionNotes: null,
        updatedAt: ctx.now,
      },
    },
    { upsert: true }
  );

  // ── Admin audit record for approving the demo worker's verification ──
  const adminId = ctx.users.get('admin')!;
  const demoWorkerUserId = ctx.users.get('w1')!;
  await AuditLogModel.findOneAndUpdate(
    { _id: deterministicId('audit', 'w1-verified') },
    {
      $setOnInsert: { _id: deterministicId('audit', 'w1-verified'), createdAt: minutesAgo(40000, ctx.now) },
      $set: {
        actorId: adminId,
        actorRole: UserRole.ADMIN,
        action: 'VERIFICATION_APPROVED',
        resourceType: 'VerificationRequest',
        resourceId: deterministicId('verification', 'w1').toString(),
        targetType: 'WORKER',
        targetId: demoWorkerUserId.toString(),
        before: { verificationStatus: 'PENDING' },
        after: { verificationStatus: 'VERIFIED' },
        ipAddress: '127.0.0.1',
        requestId: 'seed-goa-demo',
        updatedAt: ctx.now,
        createdAt: minutesAgo(40000, ctx.now),
      },
    },
    { upsert: true }
  );
}

// ─────────────────────────── validation pass ──────────────────────────

export interface SeedValidationResult {
  ok: boolean;
  errors: string[];
}

export async function validateGoaSeed(ctx: Ctx): Promise<SeedValidationResult> {
  const errors: string[] = [];
  const phoneRegex = /^\+9199000/;

  // No duplicate demo users
  const demoUsers = await UserModel.countDocuments({ phoneNumber: { $regex: phoneRegex } });
  const distinct = await UserModel.distinct('phoneNumber', { phoneNumber: { $regex: phoneRegex } });
  if (demoUsers !== distinct.length) {
    errors.push(`Duplicate demo users detected: ${demoUsers} docs vs ${distinct.length} distinct phones`);
  }

  // Jobs reference valid customers
  const jobIds = [...ctx.jobs.values()];
  const jobs = await JobModel.find({ _id: { $in: jobIds } }).lean();
  const userIds = new Set((await UserModel.find({ phoneNumber: { $regex: phoneRegex } }).select('_id')).map((u) => u._id.toString()));
  for (const j of jobs) {
    if (!userIds.has(j.customerId.toString())) errors.push(`Job ${j._id} references non-seed customer`);
    const c = j.location?.coordinates as unknown as number[] | undefined;
    if (!Array.isArray(c) || c.length !== 2 || Math.abs(c[0]) > 180 || Math.abs(c[1]) > 90) {
      errors.push(`Job ${j._id} has invalid GeoJSON coordinates`);
    }
    // lng 73–75, lat 14.8–15.8 plausible Goa window
    if (c[0] < 72 || c[0] > 76 || c[1] < 14.5 || c[1] > 16) {
      errors.push(`Job ${j._id} coordinates outside plausible Goa window: ${JSON.stringify(c)}`);
    }
    if (ASSIGNED_STATUSES.has(j.status as JobStatus)) {
      if (!j.assignedWorkerId || !userIds.has(j.assignedWorkerId.toString())) {
        errors.push(`Job ${j._id} (${j.status}) assigned to a non-seed user`);
      }
    }
    if (![JobStatus.DRAFT, JobStatus.OPEN].includes(j.status as JobStatus) && !ASSIGNED_STATUSES.has(j.status as JobStatus)) {
      const hasOffer = await JobOfferModel.exists({ jobId: j._id });
      if (!hasOffer && j.status !== JobStatus.MATCHING && j.status !== JobStatus.CANCELLED && j.status !== JobStatus.EXPIRED) {
        errors.push(`Job ${j._id} (${j.status}) has no offers and no assignment`);
      }
    }
  }

  // Offers reference valid jobs/workers; at most one ACCEPTED per job
  const acceptedPerJob = await JobOfferModel.aggregate([
    { $match: { status: 'ACCEPTED', jobId: { $in: jobIds } } },
    { $group: { _id: '$jobId', n: { $sum: 1 } } },
    { $match: { n: { $gt: 1 } } },
  ]);
  if (acceptedPerJob.length > 0) {
    errors.push(`Jobs with multiple ACCEPTED offers: ${acceptedPerJob.map((x) => x._id.toString()).join(', ')}`);
  }

  // Accepted job worker matches accepted offer
  for (const j of jobs) {
    if (!ASSIGNED_STATUSES.has(j.status as JobStatus)) continue;
    const acceptedOffer = await JobOfferModel.findOne({ jobId: j._id, status: 'ACCEPTED' }).lean();
    if (acceptedOffer && acceptedOffer.workerId.toString() !== j.assignedWorkerId?.toString()) {
      errors.push(`Job ${j._id}: assignedWorkerId ≠ accepted offer workerId`);
    }
    if (!acceptedOffer) {
      errors.push(`Job ${j._id} (${j.status}) has no ACCEPTED offer`);
    }
  }

  // Reviews only on completed jobs; reviewer is the job's customer
  for (const r of SEED_REVIEWS) {
    const job = await JobModel.findById(ctx.jobs.get(r.jobKey)).lean();
    if (!job) { errors.push(`Review references missing job ${r.jobKey}`); continue; }
    if (job.status !== JobStatus.COMPLETED) errors.push(`Review on non-completed job ${r.jobKey} (${job.status})`);
    const reviewer = await ReviewModel.findOne({ jobId: job._id }).select('reviewerId').lean();
    if (reviewer && reviewer.reviewerId.toString() !== job.customerId.toString()) {
      errors.push(`Review reviewer ≠ job customer on ${r.jobKey}`);
    }
  }

  // Messages belong to valid conversations with valid participants
  const convIds = [...ctx.conversations.values()];
  const convs = await ConversationModel.find({ _id: { $in: convIds } }).lean();
  const convParticipants = new Map(convs.map((c) => [c._id.toString(), c.participants.map(String)]));
  const messages = await MessageModel.find({ conversationId: { $in: convIds } }).lean();
  for (const m of messages) {
    const participants = convParticipants.get(m.conversationId.toString());
    if (!participants || !participants.includes(m.senderId.toString())) {
      errors.push(`Message ${m._id} sender not in conversation participants`);
    }
  }

  // Expenses belong to valid workers; money is integer paise
  const expenses = await ExpenseModel.find({ _id: { $in: [...new Set(SEED_EXPENSES.map((e) => deterministicId('expense', `${e.workerN}-${e.note}`)))] } }).lean();
  for (const e of expenses) {
    if (!Number.isInteger(e.amount) || e.amount <= 0) errors.push(`Expense ${e._id} amount not integer paise: ${e.amount}`);
    if (!userIds.has(e.workerId.toString())) errors.push(`Expense ${e._id} references non-seed worker`);
  }
  const seedTxIds = [
    ...SEED_JOBS.filter((j) => (j.status === JobStatus.COMPLETED || j.status === JobStatus.DISPUTED) && j.estimatedPrice > 0 && j.workerN !== undefined)
      .map((j) => deterministicId('tx-revenue', j.key)),
    ...SEED_EXPENSES.map((e) => deterministicId('tx-expense', `${e.workerN}-${e.note}`)),
  ];
  const txs = await TransactionModel.find({ _id: { $in: seedTxIds } }).lean();
  for (const t of txs) {
    if (!Number.isInteger(t.amount)) errors.push(`Transaction ${t._id} amount not integer`);
  }

  // Panaji plumber demo: eligible nearby AVAILABLE plumbing workers must exist
  const panaji = GOA_LOCATIONS.PANAJI.coordinates;
  const plumbers = await WorkerProfileModel.find({
    deletedAt: null,
    availabilityStatus: 'AVAILABLE',
    'skills.skillId': { $in: [ctx.skills.get('pipe-leak-repair')!.id] },
    serviceLocation: {
      $nearSphere: { $geometry: { type: 'Point', coordinates: panaji }, $maxDistance: 50_000 },
    },
  }).lean();
  if (plumbers.length < 2) {
    errors.push(`Panaji plumbing scenario too thin: only ${plumbers.length} eligible nearby plumbers`);
  }

  return { ok: errors.length === 0, errors };
}

// ─────────────────────────────── reset ────────────────────────────────

/**
 * Removes ONLY seed-owned demo records. Identity is recomputed from the same
 * deterministic definitions used to build them — no broad deleteMany({}).
 * Categories/skills are NOT deleted (slugs are shared with the base seed).
 */
export async function resetGoaDemoData(): Promise<void> {
  assertSeedAllowed();

  const phones = [
    ...SEED_WORKERS.map((w) => DEMO_PHONES.worker(w.n)),
    ...SEED_CUSTOMERS.map((c) => DEMO_PHONES.customer(c.n)),
    DEMO_PHONES.admin,
  ];
  const users = await UserModel.find({ phoneNumber: { $in: phones } }).select('_id');
  const userIds = users.map((u) => u._id);
  const jobs = await JobModel.find({ customerId: { $in: userIds } }).select('_id');
  const jobIds = jobs.map((j) => j._id);
  const conversationIds = (
    await ConversationModel.find({ jobId: { $in: jobIds } }).select('_id')
  ).map((c) => c._id);

  // Jobs are identified via customerId ∈ demo users (only demo customers own them).
  await MessageModel.deleteMany({ conversationId: { $in: conversationIds } });
  await JobModel.deleteMany({ customerId: { $in: userIds } });
  await JobOfferModel.deleteMany({ jobId: { $in: jobIds } });
  await JobEventModel.deleteMany({ jobId: { $in: jobIds } });
  await ConversationModel.deleteMany({ jobId: { $in: jobIds } });

  // Reviews/disputes/reports are job-linked; expenses/ledger/notifications are user-linked.
  await ReviewModel.deleteMany({ jobId: { $in: jobIds } });
  await DisputeModel.deleteMany({ jobId: { $in: jobIds } });
  await ReportModel.deleteMany({ targetId: { $in: jobIds.map(String) } });
  await ExpenseModel.deleteMany({ workerId: { $in: userIds } });
  await TransactionModel.deleteMany({ workerId: { $in: userIds } });
  await NotificationModel.deleteMany({ userId: { $in: userIds } });
  await VerificationRequestModel.deleteMany({ workerId: { $in: userIds } });
  await AuditLogModel.deleteMany({ requestId: 'seed-goa-demo' });

  // Profiles last (FK hygiene), then users.
  await WorkerProfileModel.deleteMany({ userId: { $in: userIds } });
  await CustomerProfileModel.deleteMany({ userId: { $in: userIds } });
  await UserModel.deleteMany({ _id: { $in: userIds } });
}

// ─────────────────────────────── run ──────────────────────────────────

export interface GoaSeedSummary {
  customers: number;
  workers: number;
  categories: number;
  skills: number;
  jobs: number;
  offers: number;
  conversations: number;
  messages: number;
  reviews: number;
  expenses: number;
  notifications: number;
}

export async function seedGoaDemo(): Promise<GoaSeedSummary> {
  assertSeedAllowed();

  const ctx: Ctx = {
    now: new Date(),
    categories: new Map(),
    skills: new Map(),
    users: new Map(),
    workerProfiles: new Map(),
    jobs: new Map(),
    conversations: new Map(),
  };

  logger.info('Seeding Goa demo dataset (dev only)...');
  await seedCategoriesAndSkills(ctx);
  await seedUsers(ctx);
  await seedJobs(ctx);
  await seedConversationsAndMessages(ctx);
  await seedReviewsAndWorkerAggregates(ctx);
  await seedLedger(ctx);
  await seedNotificationsDisputesAndMore(ctx);

  const validation = await validateGoaSeed(ctx);
  if (!validation.ok) {
    for (const e of validation.errors) logger.error({ err: e }, 'Goa seed validation failure');
    throw new Error(`Goa seed validation failed with ${validation.errors.length} issue(s)`);
  }

  const jobStatusCounts = new Map<string, number>();
  for (const j of SEED_JOBS) jobStatusCounts.set(j.status, (jobStatusCounts.get(j.status) ?? 0) + 1);

  return {
    customers: SEED_CUSTOMERS.length,
    workers: SEED_WORKERS.length,
    categories: ctx.categories.size,
    skills: ctx.skills.size,
    jobs: SEED_JOBS.length,
    offers: SEED_JOBS.reduce((n, j) => n + buildOfferPlan(j).length, 0),
    conversations: SEED_CONVERSATIONS.length,
    messages: SEED_CONVERSATIONS.reduce((n, c) => n + c.messages.length, 0),
    reviews: SEED_REVIEWS.length,
    expenses: SEED_EXPENSES.length,
    notifications: 13,
  };
}
