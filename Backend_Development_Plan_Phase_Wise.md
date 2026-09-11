**Production-Grade Express.js + MongoDB Roadmap**

A backend-only implementation plan for a hyperlocal skilled-worker marketplace. Each phase includes scope, production rules, acceptance criteria, and a copy-ready prompt for Codex or another coding agent.

| **Layer**     | **Choice**                            |
|---------------|---------------------------------------|
| Runtime       | Node.js + TypeScript                  |
| API           | Express.js 5                          |
| Database      | MongoDB Atlas + Mongoose              |
| Cache / Queue | Redis + BullMQ                        |
| Realtime      | Socket.IO                             |
| Validation    | Zod                                   |
| Logging       | Pino                                  |
| Architecture  | Modular monolith + background workers |

## Architecture Principle

Start as a modular monolith with strict module boundaries. Keep long-running work in a separate worker process. Do not start with microservices.

Express API

├── MongoDB Atlas

├── Redis

├── Socket.IO

└── BullMQ → Background Worker → Notifications / AI / Voice / Storage

# Phase 0 — Backend Foundation

**Goal:** Create the production-grade backend foundation before implementing any business features.

## Build

apps/

├── api/

└── worker/

packages/

├── config/

├── logger/

├── types/

└── validation/

apps/api/src/

├── app.ts

├── server.ts

├── config/

├── database/

├── middlewares/

├── modules/

├── routes/

├── errors/

├── utils/

└── types/

## Core dependencies

express

mongoose

zod

dotenv

helmet

cors

compression

cookie-parser

pino

pino-http

jsonwebtoken

bcrypt

redis

bullmq

socket.io

## Implement

- Express app bootstrap

- Environment validation

- MongoDB connection

- Redis connection

- Global error handler and 404 handler

- Request ID middleware

- Pino structured logging

- Strict CORS, Helmet, compression and JSON size limits

- Graceful shutdown

- GET /health and GET /ready

## Acceptance criteria

- API, MongoDB and Redis start successfully

- Missing required env values fail startup

- Unhandled errors are standardized

- Every request has requestId

- Structured logs work

- Health/readiness endpoints work

- Tests, lint and typecheck pass

## Copy-Ready Prompt — Phase 0

You are a senior backend engineer.

Build Phase 0 of a production-grade backend for a hyperlocal skilled-worker marketplace.

Tech stack:

\- Node.js

\- Express.js

\- TypeScript

\- MongoDB with Mongoose

\- Redis

\- Zod

\- Pino

\- Helmet

\- CORS

\- Compression

\- Vitest

\- Supertest

Architecture:

\- Modular monolith

\- Backend only

\- No frontend

\- No business features yet

Create a clean production structure under apps/api/src.

Implement:

1\. Express application bootstrap.

2\. server.ts separated from app.ts.

3\. Environment validation using Zod.

4\. MongoDB connection module.

5\. Redis connection module.

6\. Graceful shutdown for SIGTERM and SIGINT.

7\. Request ID middleware.

8\. Pino structured logging.

9\. Global error classes.

10\. Global error handler.

11\. 404 middleware.

12\. Helmet.

13\. Strict configurable CORS.

14\. Compression.

15\. JSON request size limits.

16\. GET /health.

17\. GET /ready.

18\. Vitest/Supertest setup.

19\. ESLint and TypeScript strict configuration.

Rules:

\- TypeScript strict mode.

\- No any unless absolutely unavoidable.

\- No business logic inside controllers.

\- No secrets hardcoded.

\- All environment values validated at startup.

\- Centralized error format.

\- Do not expose stack traces in production.

\- Use async-safe patterns.

\- Add tests for health endpoints and error handler.

\- Do not implement authentication yet.

\- Do not create frontend code.

At the end:

\- show the exact folder structure

\- list all dependencies added

\- show environment variables needed

\- run typecheck

\- run lint

\- run tests

\- fix all failures before finishing

# Phase 1 — Database Core and Repository Layer

**Goal:** Create the MongoDB architecture before implementing user workflows.

## Modules

database/

├── connection.ts

├── transaction.ts

└── indexes.ts

modules/

├── users/

├── worker-profiles/

├── customer-profiles/

├── skills/

└── service-categories/

## Initial data models

- User: role, phoneNumber, phoneVerified, email, preferredLanguage, status, profilePhotoUrl, lastLoginAt, timestamps, deletedAt

- Skill: name, slug, categoryId, active, translations

- ServiceCategory: name, slug, description, translations, icon, active

## Indexes

users.phoneNumber UNIQUE

users.email sparse UNIQUE

skills.slug UNIQUE

serviceCategories.slug UNIQUE

## Acceptance criteria

- Typed Mongoose schemas

- Explicit indexes

- Repository layer isolates persistence

- Services do not depend on Express

- Controllers never use Mongoose directly

- Soft deletion strategy exists

- Database tests pass

## Copy-Ready Prompt — Phase 1

Continue the existing backend.

Build Phase 1: MongoDB data architecture and repository layer.

Do not build authentication yet.

Create these modules:

\- users

\- worker-profiles

\- customer-profiles

\- skills

\- service-categories

Use:

\- TypeScript

\- Mongoose

\- Zod

Requirements:

1\. Create strongly typed Mongoose schemas.

2\. Add timestamps.

3\. Add deletedAt where appropriate.

4\. Add explicit indexes.

5\. Implement repository layer.

6\. Controllers must never access Mongoose models directly.

7\. Services must access data through repositories.

8\. Add database transaction helper.

9\. Normalize phone numbers before storage.

10\. Create User roles: CUSTOMER, WORKER, SUPPORT, ADMIN.

11\. Create User statuses: ACTIVE, SUSPENDED, PENDING_VERIFICATION, DELETED.

12\. Create Skill model.

13\. Create ServiceCategory model.

14\. Support translation maps for multilingual category/skill names.

15\. Add seed script for initial categories and skills.

16\. Add unit/integration tests.

Indexes:

\- users.phoneNumber unique

\- users.email sparse unique

\- skills.slug unique

\- serviceCategories.slug unique

Rules:

\- No frontend.

\- No authentication routes yet.

\- No controller business logic.

\- No duplicate validation logic.

\- Zod schemas should validate application input.

\- Do not expose Mongoose documents directly through API responses.

Run typecheck, lint and tests before finishing.

# Phase 2 — Authentication and Session Security

**Goal:** Implement production-grade phone OTP authentication and revocable sessions.

## Modules

auth/

sessions/

otp/

## Endpoints

POST /api/v1/auth/request-otp

POST /api/v1/auth/verify-otp

POST /api/v1/auth/refresh

POST /api/v1/auth/logout

POST /api/v1/auth/logout-all

GET /api/v1/auth/sessions

DELETE /api/v1/auth/sessions/:sessionId

## Token strategy

- Short-lived access token (10-15 minutes)

- Rotating refresh token

- Refresh token stored hashed server-side

- Browser refresh token uses HttpOnly + Secure + SameSite cookie

## OTP requirements

- Expiration

- Attempt limits

- Resend cooldown

- IP and phone rate limits

- Never log OTP values

- Do not retain plaintext OTP long term

## Acceptance criteria

- OTP replay blocked

- Expired OTP rejected

- Refresh rotation works

- Old refresh token invalid after rotation

- Logout and logout-all revoke sessions

- Suspended accounts cannot authenticate

## Copy-Ready Prompt — Phase 2

Continue the backend.

Build Phase 2: production-grade phone OTP authentication and session management.

Implement modules:

\- auth

\- otp

\- sessions

Endpoints:

POST /api/v1/auth/request-otp

POST /api/v1/auth/verify-otp

POST /api/v1/auth/refresh

POST /api/v1/auth/logout

POST /api/v1/auth/logout-all

GET /api/v1/auth/sessions

DELETE /api/v1/auth/sessions/:sessionId

Authentication design:

\- short-lived JWT access token

\- rotating refresh token

\- refresh token stored hashed server-side

\- refresh token delivered using HttpOnly Secure SameSite cookie

\- access token never trusted without signature verification

OTP:

\- store temporary OTP state in Redis

\- expiration

\- resend cooldown

\- maximum attempts

\- rate limiting per phone and IP

\- never log OTP values

\- design an OTPProvider interface so SMS providers can be swapped

\- create a development OTP provider for local testing only

Create middleware:

authenticate()

requireRole()

optionalAuth()

Create session management:

\- device metadata

\- IP

\- user-agent

\- expiry

\- revocation

\- logout current session

\- logout all sessions

Security:

\- suspended users cannot login

\- refresh token reuse must be detected where practical

\- revoke compromised token family when reuse occurs

\- normalize phone numbers

\- all auth actions logged safely

\- never return secrets in API response

Add complete tests covering:

\- valid OTP

\- wrong OTP

\- expired OTP

\- too many attempts

\- refresh

\- token rotation

\- logout

\- logout all

\- suspended user

\- invalid token

Run all checks and fix every failure.

# Phase 3 — Worker and Customer Profiles

**Goal:** Build the marketplace identity layer.

## Worker profile

userId

displayName

bio

skills

languages

serviceLocation (GeoJSON Point)

serviceRadiusKm

availabilityStatus

pricing

portfolio

rating

stats

verificationStatus

## Worker endpoints

GET /api/v1/workers/me

PATCH /api/v1/workers/me

PUT /api/v1/workers/me/location

PUT /api/v1/workers/me/availability

PUT /api/v1/workers/me/service-radius

POST /api/v1/workers/me/skills

DELETE /api/v1/workers/me/skills/:skillId

GET /api/v1/workers/:workerId

## Customer endpoints

GET /api/v1/customers/me

PATCH /api/v1/customers/me

POST /api/v1/customers/me/addresses

PATCH /api/v1/customers/me/addresses/:id

DELETE /api/v1/customers/me/addresses/:id

## Critical rules

- 2dsphere index on worker location

- Strict coordinate and radius validation

- Worker cannot edit verification status

- Public profile is sanitized

- Referenced skills must exist and be active

## Copy-Ready Prompt — Phase 3

Continue the backend.

Build Phase 3: Worker and Customer profiles.

Create modules:

\- worker-profiles

\- customer-profiles

WorkerProfile fields:

\- userId

\- displayName

\- bio

\- skills with experienceYears, level, verified

\- languages

\- serviceLocation as GeoJSON Point

\- serviceRadiusKm

\- availabilityStatus

\- pricing

\- portfolio metadata

\- aggregate rating

\- stats

\- verificationStatus

\- timestamps

Add 2dsphere index to serviceLocation.

Worker availability: AVAILABLE, BUSY, OFFLINE.

Verification: UNVERIFIED, PENDING, VERIFIED, REJECTED.

Create worker endpoints:

GET /api/v1/workers/me

PATCH /api/v1/workers/me

PUT /api/v1/workers/me/location

PUT /api/v1/workers/me/availability

PUT /api/v1/workers/me/service-radius

POST /api/v1/workers/me/skills

DELETE /api/v1/workers/me/skills/:skillId

GET /api/v1/workers/:workerId

Create customer profile with:

\- displayName

\- saved addresses

\- default address

\- aggregate rating

\- job stats

Create customer endpoints:

GET /api/v1/customers/me

PATCH /api/v1/customers/me

POST /api/v1/customers/me/addresses

PATCH /api/v1/customers/me/addresses/:id

DELETE /api/v1/customers/me/addresses/:id

Rules:

\- user ownership enforced

\- workers cannot edit verification status

\- customer cannot access private worker data

\- public worker endpoint returns sanitized profile

\- coordinates strictly validated

\- skills must exist and be active

\- implement Zod schemas

\- add repositories/services/controllers/routes

\- add full tests

\- no job system yet

# Phase 4 — Job Lifecycle

**Goal:** Build the core marketplace business object and immutable job history.

## Job states

DRAFT

OPEN

MATCHING

OFFERED

ACCEPTED

EN_ROUTE

ARRIVED

IN_PROGRESS

COMPLETED

CANCELLED

DISPUTED

EXPIRED

## Endpoints

POST /api/v1/jobs

GET /api/v1/jobs

GET /api/v1/jobs/:id

PATCH /api/v1/jobs/:id

POST /api/v1/jobs/:id/publish

POST /api/v1/jobs/:id/cancel

## Job events

jobId

actorId

eventType

previousState

newState

metadata

createdAt

## Rules

- Status cannot be patched directly

- All state changes go through a JobStateMachine service

- Every transition creates a JobEvent

- Owner access and editable fields are enforced

- Lists use cursor pagination

## Copy-Ready Prompt — Phase 4

Continue the backend.

Build Phase 4: Job lifecycle.

Create:

\- jobs module

\- job-events module

Job states:

DRAFT, OPEN, MATCHING, OFFERED, ACCEPTED, EN_ROUTE, ARRIVED, IN_PROGRESS, COMPLETED, CANCELLED, DISPUTED, EXPIRED.

Job fields:

\- customerId

\- categoryId

\- requiredSkills

\- title

\- description

\- source input metadata

\- GeoJSON location

\- address

\- preferredTime

\- urgency

\- estimatedPrice

\- status

\- assignedWorkerId

\- image metadata

\- timestamps

Endpoints:

POST /api/v1/jobs

GET /api/v1/jobs

GET /api/v1/jobs/:id

PATCH /api/v1/jobs/:id

POST /api/v1/jobs/:id/publish

POST /api/v1/jobs/:id/cancel

Requirements:

\- customers can only modify their own jobs

\- only editable fields can be changed

\- status cannot be directly patched

\- create JobStateMachine service

\- explicitly define valid state transitions

\- create immutable job event history

\- every state transition creates jobEvent

\- support cursor pagination

\- support status filtering

\- support category filtering

\- add MongoDB indexes for customerId/status/createdAt

\- validate category and skills

\- geolocation uses GeoJSON

\- sanitize API response

\- tests must cover every valid and invalid state transition

Do not implement matching yet.

# Phase 5 — Geospatial Matching and Job Offers

**Goal:** Build deterministic, explainable worker matching with safe concurrent acceptance.

## Matching flow

Job published

↓

MATCHING

↓

Find eligible nearby workers

↓

Calculate score

↓

Rank

↓

Create offers

↓

Dispatch in waves

## Score weights

Skill 30%

Distance 25%

Availability 15%

Rating 10%

Completion rate 10%

Acceptance rate 5%

Price compatibility 5%

## JobOffer

jobId

workerId

distanceKm

matchScore

scoreBreakdown

status

expiresAt

createdAt

respondedAt

## Endpoints

GET /api/v1/worker/offers

GET /api/v1/offers/:id

POST /api/v1/offers/:id/accept

POST /api/v1/offers/:id/reject

## Critical rule

If multiple workers accept simultaneously, exactly one succeeds. Use atomic conditions, transactions, unique indexes, and idempotency protection.

## Copy-Ready Prompt — Phase 5

Continue the backend.

Build Phase 5: production-grade geospatial matching and job offers.

Create:

\- matching module

\- job-offers module

Use MongoDB 2dsphere queries.

Matching flow:

1\. published job enters MATCHING

2\. find eligible workers

3\. filter by required skills, account active, worker available, service radius, geographic distance, verification requirements

4\. calculate deterministic match score

5\. rank candidates

6\. create JobOffers

7\. dispatch in waves

Initial score:

\- skill 30%

\- distance 25%

\- availability 15%

\- rating 10%

\- completion rate 10%

\- acceptance rate 5%

\- price compatibility 5%

Make weights configurable.

JobOffer fields:

\- jobId

\- workerId

\- distanceKm

\- matchScore

\- scoreBreakdown

\- status

\- expiresAt

\- createdAt

\- respondedAt

Statuses: PENDING, ACCEPTED, REJECTED, EXPIRED, WITHDRAWN.

Endpoints:

GET /api/v1/worker/offers

GET /api/v1/offers/:id

POST /api/v1/offers/:id/accept

POST /api/v1/offers/:id/reject

Critical concurrency:

Two workers accepting one job at the same time must result in exactly one success.

Use:

\- atomic conditional update

\- MongoDB transaction where needed

\- unique indexes

\- idempotency protection

On successful acceptance:

\- assign worker

\- update job state

\- accept winning offer

\- withdraw remaining offers

\- create job event

Add tests simulating simultaneous acceptance.

Do not use AI for worker ranking.

# Phase 6 — Job Execution and Realtime Backend

**Goal:** Handle the assigned job lifecycle and realtime updates safely.

## Action endpoints

POST /api/v1/jobs/:id/start-travel

POST /api/v1/jobs/:id/arrive

POST /api/v1/jobs/:id/start

POST /api/v1/jobs/:id/complete

## Socket events

job.offer.created

job.accepted

job.status.changed

worker.location.updated

job.completed

## Rules

- Only assigned worker can execute worker transitions

- Correct previous state is mandatory

- Socket handshake must be authenticated

- Never trust client-provided user IDs

- Authorize room joins

- Validate socket payloads with Zod

## Copy-Ready Prompt — Phase 6

Continue the backend.

Build Phase 6: Job execution and realtime events.

Implement job action endpoints:

POST /api/v1/jobs/:id/start-travel

POST /api/v1/jobs/:id/arrive

POST /api/v1/jobs/:id/start

POST /api/v1/jobs/:id/complete

Enforce:

\- only assigned worker can perform worker transitions

\- correct previous state required

\- every change creates JobEvent

\- invalid transitions return domain errors

\- operations are idempotent where necessary

Add Socket.IO to the Express server.

Implement authenticated sockets.

Rooms:

user:{userId}

job:{jobId}

Server events:

job.offer.created

job.accepted

job.status.changed

worker.location.updated

job.completed

Security:

\- authenticate socket handshake

\- derive user identity from auth token

\- never trust client-provided user ID

\- authorize room joins

\- apply rate limiting to high-frequency socket events

\- validate socket payloads with Zod

Prepare Redis adapter configuration for future horizontal scaling.

Add tests for job transitions and socket authorization.

# Phase 7 — Messaging and Notifications

**Goal:** Add job-scoped communication and provider-independent notifications.

## Message types

TEXT

IMAGE

SYSTEM

LOCATION

## Messaging endpoints

GET /api/v1/jobs/:jobId/conversation

GET /api/v1/conversations/:id/messages

POST /api/v1/conversations/:id/messages

POST /api/v1/conversations/:id/read

## Notification channels

IN_APP

PUSH

SMS

EMAIL

## Rules

- Only job participants access conversations

- Cursor pagination for messages

- System messages cannot be forged by users

- BullMQ handles delivery/retry

- Provider logic is abstracted

## Copy-Ready Prompt — Phase 7

Continue the backend.

Build Phase 7: messaging and notifications.

Create modules:

\- conversations

\- messages

\- notifications

Conversation belongs to a job.

Message types: TEXT, IMAGE, SYSTEM, LOCATION.

Endpoints:

GET /api/v1/jobs/:jobId/conversation

GET /api/v1/conversations/:id/messages

POST /api/v1/conversations/:id/messages

POST /api/v1/conversations/:id/read

Rules:

\- only job participants can access conversation

\- cursor pagination for messages

\- messages cannot be edited into system messages

\- validate attachments

\- emit realtime events through Socket.IO

Create notification service abstraction supporting:

IN_APP, PUSH, SMS, EMAIL.

Create Notification model:

\- userId

\- type

\- channel

\- title

\- body

\- data

\- readAt

\- deliveredAt

\- failedAt

\- createdAt

Use BullMQ for notification delivery.

Implement retry with exponential backoff.

Do not hardcode SMS/push vendor logic inside business services.

Add tests.

# Phase 8 — Earnings, Expenses and Financial Ledger

**Goal:** Implement worker financial intelligence using integer money and an immutable ledger.

## Money rule

Never use floating point. Store INR in paise. Example: ₹499.99 = 49999.

## Expense categories

FUEL

MATERIAL

PARKING

TOOL

PLATFORM_FEE

OTHER

## Transaction types

JOB_REVENUE

EXPENSE

PLATFORM_FEE

REFUND

ADJUSTMENT

## APIs

POST /api/v1/expenses

GET /api/v1/expenses

PATCH /api/v1/expenses/:id

DELETE /api/v1/expenses/:id

GET /api/v1/earnings/summary

GET /api/v1/earnings/jobs

GET /api/v1/transactions

## Earnings outputs

- Gross revenue

- Expenses

- Net earnings

- Hours worked

- Earnings/hour

- Today/week/month/custom range

## Copy-Ready Prompt — Phase 8

Continue the backend.

Build Phase 8: Worker earnings, expenses and immutable financial ledger.

Critical rule:

Never use floating point values for money.

Store amounts as integer smallest currency unit.

Currency initially: INR.

Create Expense model with workerId, optional jobId, category, amount, currency, note, receipt metadata, timestamps.

Expense categories: FUEL, MATERIAL, PARKING, TOOL, PLATFORM_FEE, OTHER.

Create Transaction model with workerId, jobId, type, amount, currency, referenceId, metadata, timestamp.

Transaction types: JOB_REVENUE, EXPENSE, PLATFORM_FEE, REFUND, ADJUSTMENT.

Create APIs:

POST /api/v1/expenses

GET /api/v1/expenses

PATCH /api/v1/expenses/:id

DELETE /api/v1/expenses/:id

GET /api/v1/earnings/summary

GET /api/v1/earnings/jobs

GET /api/v1/transactions

Earnings summary:

\- gross revenue

\- total expenses

\- net earnings

\- total jobs

\- hours worked

\- earnings per hour

Support today, week, month, custom date range.

Requirements:

\- workers only access their records

\- ledger entries are immutable

\- adjustments require privileged workflow

\- indexes for workerId + createdAt

\- tests for all money calculations

\- tests must verify no floating-point errors

# Phase 9 — Reviews, Verification and Trust & Safety

**Goal:** Add marketplace trust, moderation, reporting and dispute primitives.

## Reviews

Only completed-job participants can review. Use unique jobId + reviewerId. Store rating, quality, punctuality, communication and optional comment.

## Verification

PENDING

APPROVED

REJECTED

REQUIRES_MORE_INFO

## Report targets

USER

JOB

MESSAGE

REVIEW

## Dispute statuses

OPEN

UNDER_REVIEW

RESOLVED

REJECTED

## Rules

- Workers cannot approve their own verification

- Support has limited permissions

- Admin actions create audit logs

- Rating aggregates must update safely

## Copy-Ready Prompt — Phase 9

Continue the backend.

Build Phase 9: trust, reviews, worker verification, reporting and disputes.

Create modules:

\- reviews

\- verification

\- reports

\- disputes

Reviews:

\- only users involved in completed jobs may review

\- one review per reviewer per job

\- rating 1–5

\- quality

\- punctuality

\- communication

\- optional comment

\- recalculate worker aggregate rating safely

VerificationRequest:

\- workerId

\- type

\- submitted documents metadata

\- status

\- reviewerId

\- reason

\- timestamps

Statuses: PENDING, APPROVED, REJECTED, REQUIRES_MORE_INFO.

Reports allow reporting USER, JOB, MESSAGE, REVIEW.

Disputes: OPEN, UNDER_REVIEW, RESOLVED, REJECTED.

Create appropriate user APIs and admin/support APIs.

Rules:

\- worker cannot approve own verification

\- support permissions are limited

\- admin actions create audit log

\- duplicate reviews prevented using unique indexes

\- rating aggregate updates must be concurrency safe

\- reported content remains traceable

\- add tests for permissions and edge cases

# Phase 10 — File Upload Backend

**Goal:** Support secure direct-to-object-storage uploads for media and documents.

## Purposes

PROFILE_PHOTO

WORKER_PORTFOLIO

JOB_IMAGE

EXPENSE_RECEIPT

VERIFICATION_DOCUMENT

## Flow

Client requests upload authorization

↓

Backend validates purpose/type/size

↓

Backend issues short-lived signed URL

↓

Client uploads directly to S3/R2

↓

Client confirms

↓

Backend verifies metadata

↓

Database record created

## Endpoints

POST /api/v1/uploads/presign

POST /api/v1/uploads/complete

DELETE /api/v1/uploads/:id

## Rules

- Do not proxy large uploads through Express

- Never trust user filenames

- Private verification docs stay private

- Use signed downloads where appropriate

## Copy-Ready Prompt — Phase 10

Continue the backend.

Build Phase 10: secure file upload architecture.

Do not upload large files through the Express API.

Create a StorageProvider abstraction.

Implement an S3-compatible provider suitable for AWS S3 or Cloudflare R2.

Upload flow:

1\. authenticated client requests upload authorization

2\. backend validates file purpose, MIME type and size

3\. backend generates random object key

4\. backend creates short-lived presigned upload URL

5\. client uploads directly to object storage

6\. client confirms upload

7\. backend verifies metadata

8\. backend stores file record

Support purposes:

PROFILE_PHOTO

WORKER_PORTFOLIO

JOB_IMAGE

EXPENSE_RECEIPT

VERIFICATION_DOCUMENT

Endpoints:

POST /api/v1/uploads/presign

POST /api/v1/uploads/complete

DELETE /api/v1/uploads/:id

Validate MIME types, extensions, size, ownership and allowed purpose.

Never trust user filename.

Do not expose private verification documents publicly.

Create signed download URLs where needed.

Add tests.

# Phase 11 — AI and Voice Backend

**Goal:** Add provider abstractions for AI and speech without making critical workflows depend on them.

## AIProvider

classifyJob()

extractWorkerProfile()

simplifyJobDescription()

translateText()

## SpeechProvider

speechToText()

textToSpeech()

detectLanguage()

## Potential endpoints

POST /api/v1/ai/jobs/classify

POST /api/v1/ai/workers/extract-profile

POST /api/v1/ai/translate

POST /api/v1/ai/jobs/simplify

## Critical restrictions

- Validate all structured AI output with Zod

- Implement timeouts/fallbacks

- Matching never depends on AI

- AI cannot verify workers, assign jobs, change ledger, ban users, or perform irreversible admin actions

## Copy-Ready Prompt — Phase 11

Continue the backend.

Build Phase 11: AI and voice provider layer.

Core business flows must continue working when AI is unavailable.

Create abstractions:

AIProvider: classifyJob, extractWorkerProfile, simplifyJobDescription, translateText.

SpeechProvider: speechToText, textToSpeech, detectLanguage.

Do not scatter vendor SDK calls throughout modules.

Create AIService, SpeechService and provider adapters.

All AI structured output must be validated using Zod before use.

Implement timeouts.

Implement retry only for safe operations.

Implement circuit-breaker style protection or temporary provider disablement after repeated failure.

Fallback behavior:

\- job creation can fall back to manual fields

\- profile onboarding can fall back to form input

\- translation failure returns canonical content

\- matching never depends on AI

Add BullMQ jobs for long AI/audio processing.

Do not allow AI to:

\- approve worker verification

\- assign workers

\- modify financial ledger

\- ban users

\- make irreversible administrative decisions

Add tests with mocked providers.

# Phase 12 — Admin Backend and Audit System

**Goal:** Provide operational controls with strict roles and append-only audit logging.

## Admin endpoints

GET /api/v1/admin/users

GET /api/v1/admin/users/:id

POST /api/v1/admin/users/:id/suspend

POST /api/v1/admin/users/:id/restore

GET /api/v1/admin/workers

POST /api/v1/admin/verifications/:id/approve

POST /api/v1/admin/verifications/:id/reject

GET /api/v1/admin/jobs

GET /api/v1/admin/reports

GET /api/v1/admin/disputes

GET /api/v1/admin/audit-logs

## Audit fields

actorId

actorRole

action

resourceType

resourceId

before

after

ipAddress

requestId

createdAt

## Rules

- SUPPORT has fewer permissions than ADMIN

- Audit logs are append-only

- Sensitive values are redacted

- Admin lists use cursor pagination/filtering

## Copy-Ready Prompt — Phase 12

Continue the backend.

Build Phase 12: admin backend and immutable audit logging.

Create admin APIs for users, workers, verification, jobs, reports, disputes, service categories, skills and audit logs.

Roles: ADMIN and SUPPORT. SUPPORT must have strictly fewer permissions than ADMIN.

Create AuditLog model:

\- actorId

\- actorRole

\- action

\- resourceType

\- resourceId

\- before

\- after

\- ipAddress

\- requestId

\- createdAt

Audit:

\- suspension

\- restoration

\- role changes

\- verification decisions

\- dispute decisions

\- financial adjustments

\- category/skill changes

\- sensitive data access where appropriate

Rules:

\- audit records cannot be edited

\- audit records cannot be deleted through normal admin APIs

\- sensitive values must be redacted

\- authorization enforced at service layer

\- admin list endpoints use cursor pagination and filtering

Add exhaustive permission tests.

# Phase 13 — Security Hardening

**Goal:** Perform a production security pass across the entire backend.

## Controls

- Redis-backed rate limiting

- Strict CORS and Helmet

- Payload limits and safe query parsing

- NoSQL injection protections

- Secure cookies and JWT validation

- Refresh-token reuse protection

- Request timeout

- Upload authorization

- RBAC and ownership checks

- Safe error output

- Sensitive log redaction

## Security tests

Unauthorized access

Horizontal privilege escalation

Vertical privilege escalation

OTP abuse

Token replay

Refresh-token reuse

NoSQL injection

Oversized request

Malformed JWT

Malicious file metadata

Job ownership bypass

Admin endpoint access

## Copy-Ready Prompt — Phase 13

Continue the backend.

Build Phase 13: security hardening.

Perform a production security pass across the entire Express backend.

Implement/review:

\- Helmet

\- strict CORS

\- Redis-backed rate limiting

\- OTP abuse protection

\- authentication brute-force protection

\- request size limits

\- safe query parsing

\- NoSQL injection protections

\- HTTP parameter pollution protections where relevant

\- secure cookies

\- JWT validation

\- refresh token reuse protection

\- request timeout

\- upload authorization

\- RBAC

\- object ownership checks

\- admin authorization

\- safe error output

\- sensitive log redaction

Review every endpoint for:

\- authentication

\- authorization

\- ownership

\- validation

\- rate limiting

\- idempotency

\- information leakage

Create automated tests for horizontal privilege escalation, vertical privilege escalation, unauthorized object access, invalid/expired JWT, revoked refresh session, malicious MongoDB payloads, oversized bodies and rate limits.

Produce SECURITY.md documenting backend security assumptions.

# Phase 14 — Observability and Production Operations

**Goal:** Make failures diagnosable and measurable in production.

## Logging

Pino structured logs with requestId, route, method, statusCode, duration, and safe user context.

## Monitoring

Sentry for exceptions and release visibility.

## Metrics

Request count

p50/p95/p99 latency

Status codes

MongoDB latency

Redis latency

BullMQ queue depth

Failed jobs

Matching latency

Offer acceptance latency

Socket connections

Notification failures

## Never log

OTP

Access token

Refresh token

Authorization header

Verification document contents

Payment secrets

## Copy-Ready Prompt — Phase 14

Continue the backend.

Build Phase 14: production observability.

Implement:

\- structured Pino logging

\- log redaction

\- request correlation IDs

\- Sentry integration

\- application metrics

\- health checks

\- readiness checks

\- dependency status checks

Metrics should cover request count, p50/p95/p99 latency, status-code distribution, MongoDB latency, Redis latency, BullMQ queue depth, failed background jobs, matching latency, offer acceptance latency, active socket connections and notification failure rate.

Never log OTP, access token, refresh token, Authorization header, verification document contents or payment secrets.

Propagate requestId into background jobs where possible.

Add production-safe logging configuration.

# Phase 15 — Testing and Load Testing

**Goal:** Prove correctness under normal, failure and high-concurrency conditions.

## Unit tests

State machine

Matching algorithm

Earnings calculations

Authorization

Validation

## Integration tests

MongoDB

Redis

Authentication

Transactions

Queues

## Concurrency target

Simulate at least 50 workers accepting the same job. Expected result: 1 success, 49 conflicts/already assigned.

## Load testing

Use k6 progressively at 500, 1,000 and 5,000 concurrent users. Track API latency, database load, queue delay and error rate.

## Copy-Ready Prompt — Phase 15

Continue the backend.

Build Phase 15: comprehensive automated testing and load testing.

Create:

\- unit test suite

\- integration suite

\- API test suite

\- concurrency suite

\- load test scripts

Must cover authentication, authorization, job state transitions, matching, concurrency, finance, messaging and admin permissions.

Concurrency:

Simulate at least 50 workers accepting the same job.

Exactly one must succeed.

Load tests using k6:

\- health endpoint

\- authentication

\- job listing

\- job creation

\- offer listing

\- acceptance path

Create test documentation and thresholds.

Do not hide failing tests.

Fix backend bugs discovered during testing.

# Phase 16 — Docker, CI/CD and Deployment

**Goal:** Make backend services repeatably buildable, testable and deployable.

## Docker

API container

Worker container

Local MongoDB

Local Redis

## CI pipeline

install

↓

lint

↓

typecheck

↓

unit tests

↓

integration tests

↓

build

↓

dependency security audit

## Production topology

API container

Worker container

MongoDB Atlas

Managed Redis

S3/R2 object storage

## Rules

- Use multi-stage builds

- Run containers as non-root

- Include healthchecks and graceful shutdown

- Keep background workers outside API process

- Document migrations and rollback

## Copy-Ready Prompt — Phase 16

Continue the backend.

Build Phase 16: production deployment setup.

Create Docker configuration for:

\- Express API

\- BullMQ worker

Create docker-compose for local development with:

\- API

\- worker

\- MongoDB

\- Redis

Use multi-stage production Docker builds.

Requirements:

\- non-root user

\- minimal runtime image

\- healthcheck

\- graceful shutdown

\- environment-based configuration

Create GitHub Actions pipeline:

1\. install

2\. lint

3\. typecheck

4\. unit tests

5\. integration tests

6\. build

7\. dependency security audit

Prepare deployment documentation for:

\- API container

\- worker container

\- MongoDB Atlas

\- managed Redis

\- S3/R2 storage

\- environment variables

\- migrations

\- rollback

Do not run background workers inside the API process.

Create DEPLOYMENT.md.

# Recommended Build Order

Phase 0 Foundation

↓

Phase 1 Database architecture

↓

Phase 2 Authentication

↓

Phase 3 Worker/customer profiles

↓

Phase 4 Jobs

↓

Phase 5 Matching

↓

Phase 6 Job execution + realtime

↓

Phase 7 Messaging + notifications

↓

Phase 8 Earnings + expenses

↓

Phase 9 Trust + reviews + disputes

↓

Phase 10 File storage

↓

Phase 11 AI + voice

↓

Phase 12 Admin

↓

Phase 13 Security

↓

Phase 14 Observability

↓

Phase 15 Testing + load testing

↓

Phase 16 Deployment

## How to Use This Plan

1.  Give only one phase at a time to Codex or your coding agent.

2.  After every phase, run tests, lint and typecheck.

3.  Fix all failures before moving forward.

4.  Commit the completed phase independently.

5.  Do not let later phases silently rewrite earlier architectural boundaries without a deliberate decision.

## Suggested Git History

feat: bootstrap backend infrastructure

feat: add database architecture

feat: implement OTP authentication

feat: add worker profiles

feat: implement job lifecycle

feat: add matching engine

feat: add realtime job workflow

feat: add messaging

feat: add worker financial tracking

feat: add trust and verification

feat: implement object storage

feat: add AI provider abstraction

feat: add administration

security: harden backend

chore: add observability

test: add production test suite

chore: add production deployment

## Final Backend Target

Client Applications

│

▼

Express API

├── MongoDB Atlas

├── Redis

│ ├── BullMQ → Background Worker

│ └── Socket.IO

└── S3/R2 Object Storage

Background Worker → Notifications / AI / Voice providers

## Non-Negotiable Engineering Rules

- TypeScript strict mode throughout the backend.

- Controllers stay thin; business rules live in services.

- Database access goes through repositories.

- Backend is the source of truth for authorization, job state and money.

- Use integer smallest currency units for financial amounts.

- Critical mutations are idempotent and concurrency-safe.

- Core marketplace workflows must continue when AI is unavailable.

- Every administrative and financial action must be traceable.

- Do not move to microservices until production scale or team boundaries justify it.

## Recommended Core Stack

| **Layer**        | **Technology**                  |
|------------------|---------------------------------|
| Language         | TypeScript                      |
| API              | Express.js                      |
| Database         | MongoDB Atlas                   |
| ODM              | Mongoose                        |
| Validation       | Zod                             |
| Cache            | Redis                           |
| Queue            | BullMQ                          |
| Realtime         | Socket.IO                       |
| Logging          | Pino                            |
| Error monitoring | Sentry                          |
| Tests            | Vitest/Jest + Supertest         |
| Load tests       | k6                              |
| Storage          | S3/R2 compatible object storage |
| CI/CD            | GitHub Actions                  |
