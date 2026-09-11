# Technical Requirements Document (TRD)

## Local Skilled-Worker Service Platform

**Document Version:** 1.0  
**Status:** Architecture Baseline  
**Target:** Production-ready web/PWA platform  
**Primary Market:** India  
**Architecture:** Modular Monolith + Event/Worker Architecture  
**Frontend:** Next.js + React + TypeScript  
**Backend:** Express.js + Node.js + TypeScript  
**Primary Database:** MongoDB Atlas  
**Working Product Description:** Voice-first hyperlocal marketplace connecting customers with skilled and semi-skilled local workers.

---

## 1. Product Vision

Build an accessible digital work platform for skilled and semi-skilled workers such as:

- Electricians
- Plumbers
- Carpenters
- Painters
- Mechanics
- Welders
- AC technicians
- Appliance repair technicians
- Construction workers
- Masons
- Helpers
- Other local service providers

The platform should allow a worker with limited English or limited experience using employment platforms to:

1. Create a professional profile.
2. Specify skills and service area.
3. Set availability.
4. Receive nearby work opportunities.
5. Understand jobs in their preferred language.
6. Accept or reject work easily.
7. Communicate with the customer.
8. Track completed jobs.
9. Build a portable reputation.
10. Track revenue, expenses and actual profit.

Customers should be able to:

1. Describe their problem using text, voice or photos.
2. Automatically classify the required service.
3. Discover suitable nearby workers.
4. Request service.
5. Receive responses.
6. Track job progress.
7. Pay or record payment.
8. Review the worker.
9. Access previous jobs and receipts.

The platform must prioritize:

**Accessibility → trust → simplicity → reliability → worker earnings visibility.**

---

## 2. Product Principle

This must NOT become only:

`Search → Select Worker → Book`

The main product loop is:

`Problem`
→ `Understand service required`
→ `Find suitable nearby workers`
→ `Offer job`
→ `Worker understands job`
→ `Accept`
→ `Travel`
→ `Perform work`
→ `Record payment`
→ `Record expenses`
→ `Calculate actual earnings`
→ `Build reputation`

AI can enhance the experience, but the underlying marketplace must work even if an AI provider is temporarily unavailable.

---

## 3. Goals

### 3.1 Primary Goals

The platform must:

- Make worker onboarding possible in minutes.
- Support phone-first authentication.
- Support regional-language interfaces.
- Support voice-first interactions.
- Provide hyperlocal worker discovery.
- Match customers and workers intelligently.
- Work well on inexpensive Android devices.
- Work on slow/mobile networks.
- Provide a PWA experience.
- Maintain reliable job state.
- Maintain financial records accurately.
- Protect personal information.
- Provide administrative moderation.
- Scale from hundreds to hundreds of thousands of users.

---

## 4. Non-Goals for V1

V1 should NOT attempt to build:

- Payroll processing.
- Lending.
- Worker insurance products.
- Full accounting software.
- Government employment integration.
- Complex bidding marketplaces.
- Cryptocurrency payments.
- Automated worker termination/banning based solely on AI.
- Fully autonomous AI job assignment.
- Native Android/iOS applications.

These can be introduced later.

The first product should be an installable PWA.

---

## 5. User Roles

### Customer

Can:

- Create account.
- Manage profile.
- Create jobs.
- Upload job images.
- Record voice descriptions.
- Receive worker recommendations.
- Send job requests.
- Track active jobs.
- Chat with workers.
- Cancel jobs.
- Complete jobs.
- Make/record payments.
- Review workers.
- Report problems.

### Worker

Can:

- Complete onboarding.
- Add skills.
- Define service radius.
- Set availability.
- Set approximate pricing.
- Upload portfolio.
- Receive nearby job requests.
- Accept/reject requests.
- Navigate to customer.
- Change job status.
- Record materials.
- Record travel expenses.
- Record miscellaneous expenses.
- View revenue.
- View net profit.
- View ratings.
- Manage profile.

### Administrator

Can:

- Search users.
- Inspect workers.
- Review verification submissions.
- Suspend accounts.
- Review reports.
- Manage categories.
- Manage skills.
- Review disputes.
- View system health.
- View marketplace metrics.
- Manage flagged content.
- Manage service regions.

### Support Agent

Limited administrative role for:

- Customer support.
- Job investigation.
- Dispute handling.
- Refund/support actions.

Support agents should NOT automatically receive unrestricted administrator permissions.

---

## 6. Technology Stack

### Frontend

#### Core

- Next.js 16.x
- React 19.x
- TypeScript
- App Router
- Server Components where beneficial
- Client Components only where interactivity requires them

#### UI

Recommended:

- Tailwind CSS
- shadcn/ui
- Radix primitives
- Lucide icons

The UI should have a custom design system rather than looking like an unchanged component-library demo.

### Backend

- Node.js
- Express.js 5.x
- TypeScript

Express owns:

- Authentication
- Authorization
- User management
- Worker management
- Jobs
- Matching
- Financial records
- Reviews
- Notifications
- Admin APIs
- Webhooks
- Realtime authorization
- Audit logging

Next.js must NOT duplicate these business rules.

---

## 7. Repository Architecture

Use a monorepo.

Recommended structure:

```text
service-platform/
│
├── apps/
│   ├── web/
│   │   └── Next.js application
│   │
│   ├── api/
│   │   └── Express API
│   │
│   └── worker/
│       └── Background job processor
│
├── packages/
│   ├── ui/
│   ├── types/
│   ├── validation/
│   ├── config/
│   ├── logger/
│   └── eslint-config/
│
├── infrastructure/
│   ├── docker/
│   ├── scripts/
│   └── deployment/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── decisions/
│
├── .github/
│   └── workflows/
│
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

Recommended package manager:

```text
pnpm
```

Shared types should live in:

```text
packages/types
```

Shared Zod schemas may live in:

```text
packages/validation
```

---

## 8. High-Level Architecture

```text
                         ┌─────────────────┐
                         │     Browser     │
                         │       PWA       │
                         └────────┬────────┘
                                  │
                                  ▼
                         ┌─────────────────┐
                         │     Next.js     │
                         │      React      │
                         │   Web Frontend  │
                         └────────┬────────┘
                                  │ HTTPS
                                  ▼
                    ┌──────────────────────────┐
                    │       Express API        │
                    │                          │
                    │ Authentication           │
                    │ Users                    │
                    │ Workers                  │
                    │ Jobs                     │
                    │ Matching                 │
                    │ Payments                 │
                    │ Earnings                 │
                    │ Reviews                  │
                    │ Admin                    │
                    └──────┬────────┬─────────┘
                           │        │
                   ┌───────▼───┐    ▼
                   │ MongoDB   │  Redis
                   │  Atlas    │
                   └───────────┘
                           │
                           ▼
                   ┌───────────────┐
                   │ Background    │
                   │ Worker        │
                   └──────┬────────┘
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
     Notification       Maps          AI/Voice
       Provider        Provider        Provider
```

---

## 9. Architectural Pattern

Start with a **modular monolith**.

Do NOT start with microservices.

Modules should still have strict boundaries so they can later be extracted if required.

Example:

```text
src/modules/

auth/
users/
workers/
customers/
jobs/
matching/
messages/
reviews/
payments/
earnings/
notifications/
files/
admin/
analytics/
```

Each module should normally contain:

```text
controller
service
repository
model
schema
routes
types
tests
```

Controllers must remain thin.

Business rules belong inside services.

Database operations belong inside repositories.

---

## 10. Database

Use:

**MongoDB Atlas**

Recommended ODM:

**Mongoose**

MongoDB should be the system of record.

Redis must NOT replace MongoDB as permanent storage.

---

## 11. Major Collections

Recommended collections:

```text
users
workerProfiles
customerProfiles
skills
serviceCategories
jobs
jobOffers
jobEvents
workerAvailability
conversations
messages
reviews
transactions
expenses
paymentRecords
notifications
deviceTokens
verificationRequests
reports
disputes
auditLogs
refreshSessions
```

---

## 12. User Model

```ts
User {
  _id
  role: "customer" | "worker" | "admin" | "support"

  phoneNumber
  phoneVerified

  email?
  emailVerified?

  preferredLanguage

  status:
    "active"
    | "suspended"
    | "pending_verification"
    | "deleted"

  profilePhotoUrl?

  createdAt
  updatedAt
  lastLoginAt
}
```

Do not store plaintext passwords if phone OTP is the primary authentication system.

---

## 13. Worker Profile Model

```ts
WorkerProfile {
  _id
  userId

  displayName

  skills: [
    {
      skillId
      experienceYears
      level
      verified
    }
  ]

  bio

  languages: []

  serviceLocation: {
    type: "Point",
    coordinates: [longitude, latitude]
  }

  serviceRadiusKm

  availabilityStatus:
    "available"
    | "busy"
    | "offline"

  pricing: {
    visitFee?
    hourlyRate?
    minimumCharge?
  }

  portfolio: []

  rating: {
    average
    totalReviews
  }

  stats: {
    completedJobs
    cancelledJobs
    acceptanceRate
    completionRate
  }

  verificationStatus

  createdAt
  updatedAt
}
```

Create a MongoDB `2dsphere` index on:

```text
serviceLocation
```

---

## 14. Job Model

```ts
Job {
  _id

  customerId

  categoryId
  requiredSkills: []

  title
  description

  originalInput?: {
    type: "text" | "voice" | "image"
    transcript?
  }

  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  }

  address

  preferredTime

  urgency:
    "normal"
    | "urgent"

  estimatedPrice?: {
    min
    max
    currency
  }

  status

  assignedWorkerId?

  images: []

  createdAt
  updatedAt
}
```

---

## 15. Job State Machine

```text
DRAFT
   ↓
OPEN
   ↓
MATCHING
   ↓
OFFERED
   ↓
ACCEPTED
   ↓
EN_ROUTE
   ↓
ARRIVED
   ↓
IN_PROGRESS
   ↓
COMPLETED
```

Alternative terminal states:

```text
CANCELLED
DISPUTED
EXPIRED
```

Use explicit action endpoints rather than arbitrary status mutation.

---

## 16. Job Offer Model

```ts
JobOffer {
  _id

  jobId
  workerId

  distanceKm

  matchScore

  status:
    "pending"
    | "accepted"
    | "rejected"
    | "expired"
    | "withdrawn"

  expiresAt

  createdAt
  respondedAt?
}
```

---

## 17. Matching Engine

The matching system should initially be deterministic.

AI should NOT decide who gets work.

Candidate filtering:

```text
required skill
worker active
worker available
worker service radius
verification requirements
geographic radius
not blocked by customer
not suspended
```

---

## 18. Matching Score

```text
Match Score =

Skill Match             30%
Distance                25%
Availability            15%
Rating                  10%
Completion Rate         10%
Acceptance Reliability   5%
Price Compatibility      5%
```

Example:

```text
score =
(skillScore * 0.30) +
(distanceScore * 0.25) +
(availabilityScore * 0.15) +
(ratingScore * 0.10) +
(completionScore * 0.10) +
(reliabilityScore * 0.05) +
(priceScore * 0.05)
```

Store match score for explainability and marketplace analysis.

---

## 19. Dispatch Strategy

### Wave 1

Top 5 nearby workers.

### Wave 2

Next 10.

### Wave 3

Increase distance slightly.

Continue until:

- worker accepts,
- customer cancels,
- maximum radius reached,
- or job expires.

---

## 20. Concurrency Protection

Two workers may attempt to accept the same job simultaneously.

Use:

- atomic conditional update
- and/or transaction

Condition:

```text
job.status == OFFERED
AND
job.assignedWorkerId == null
```

Only one operation must succeed.

---

## 21. Authentication

Primary authentication:

**Phone number + OTP**

Optional:

- Google authentication
- Email authentication

---

## 22. Session Strategy

Recommended:

- Short-lived access token
- Rotating refresh token
- Refresh token stored in `HttpOnly`, `Secure`, `SameSite` cookie
- Server-side refresh-session store

Do NOT store long-lived authentication tokens in `localStorage`.

---

## 23. Authorization

Implement RBAC and ownership checks.

Example permissions:

```text
customer:create-job
customer:view-own-job

worker:view-offer
worker:accept-offer
worker:update-own-job

support:view-dispute

admin:suspend-user
admin:verify-worker
```

---

## 24. Worker Onboarding

```text
Phone Number
     ↓
OTP
     ↓
Preferred Language
     ↓
Name
     ↓
Skill Selection / Voice Description
     ↓
Experience
     ↓
Location
     ↓
Service Radius
     ↓
Availability
     ↓
Optional Portfolio
     ↓
Verification
     ↓
Worker Dashboard
```

Target onboarding: 3–5 minutes.

---

## 25. Voice-First Worker Experience

```text
Audio
 ↓
Speech-to-Text
 ↓
Language Detection
 ↓
Structured Extraction
 ↓
Validation
 ↓
Worker confirms result
 ↓
Profile updated
```

AI must never silently modify critical account information.

---

## 26. Customer Job Creation

Support:

- Quick text
- Voice
- Guided form
- Images

AI may extract structured job information, but the customer confirms before publication.

---

## 27. AI Architecture

```ts
interface AIProvider {
  classifyJob()
  extractWorkerProfile()
  simplifyJobDescription()
  translateText()
}
```

Use an `AIService` abstraction and provider adapters.

Core business logic must not depend on a single AI provider.

---

## 28. AI Failure Strategy

If AI fails:

- Customers can still create jobs manually.
- Workers can still accept jobs.
- Matching still operates.
- Payments still operate.

Core business processes must not depend on an LLM.

---

## 29. Translation

Store canonical structured information separately from translated display text.

Example:

```text
Canonical category:
PLUMBING

English:
Plumbing

Hindi:
प्लंबिंग
```

---

## 30. Financial System

### True Earnings

```text
Revenue
− Materials
− Travel
− Platform fees
− Other expenses
= Net earnings
```

---

## 31. Money Representation

Never use floating-point numbers for money.

Store money in the smallest unit.

```ts
{
  amount: 49999,
  currency: "INR"
}
```

Meaning:

```text
₹499.99
```

---

## 32. Expense Model

```ts
Expense {
  _id
  workerId
  jobId?

  category:
    "fuel"
    | "material"
    | "parking"
    | "tool"
    | "platform_fee"
    | "other"

  amount

  currency: "INR"

  note?

  receiptUrl?

  createdAt
}
```

---

## 33. Worker Earnings

```text
TODAY

Revenue                     ₹1,200

Expenses
Fuel                         ₹180
Material                     ₹220
Parking                       ₹50
                            -------
Total expenses               ₹450

NET EARNINGS                 ₹750

Hours worked                  4.5

Effective earnings/hour      ₹167
```

Support daily, weekly, monthly and custom periods.

---

## 34. Financial Ledger

```ts
Transaction {
  _id
  workerId
  jobId

  type:
    "job_revenue"
    | "expense"
    | "platform_fee"
    | "refund"
    | "adjustment"

  amount
  currency

  referenceId

  createdAt
}
```

Balances should be derivable from transaction history.

---

## 35. Payments

Provider-independent interface:

```ts
interface PaymentProvider {
  createOrder()
  verifyPayment()
  refundPayment()
  verifyWebhook()
}
```

Possible providers:

- Razorpay
- Cashfree
- PhonePe
- Stripe where applicable

---

## 36. Payment Webhooks

Must support:

- signature validation
- idempotency
- retries
- duplicate-event protection
- event logging

Never trust success information sent directly from the browser.

---

## 37. Communication

Support:

```text
Customer ↔ Worker
```

Each conversation should be linked to a job.

Features:

- Text
- Images
- System messages
- Location
- Job status updates

---

## 38. Realtime Architecture

Use:

**Socket.IO**

For:

- Job offers
- Job acceptance
- Chat
- Worker status
- Job status
- Customer updates

Critical notifications should also use Web Push/FCM or SMS.

---

## 39. Redis

Use Redis for:

- Rate limiting
- BullMQ queues
- Temporary OTP data
- Distributed locks
- Caching
- Socket.IO scaling
- Idempotency keys

Redis is not the primary database.

---

## 40. Background Jobs

Use:

**BullMQ**

Responsibilities:

- Send notifications
- Retry notifications
- Expire offers
- Dispatch matching waves
- Generate thumbnails
- Process uploads
- Perform AI processing
- Handle webhook retries
- Recalculate analytics

---

## 41. File Storage

Do not store photos, videos, audio, certificates, or documents directly in MongoDB.

Use:

- AWS S3
- Cloudflare R2
- Compatible object storage

MongoDB stores metadata and URLs.

---

## 42. Upload Security

Validate:

- MIME type
- file extension
- actual content type
- maximum size
- image dimensions where appropriate

Use random object names and scan files where required.

---

## 43. API Design

Version APIs:

```text
/api/v1
```

Examples:

```http
POST   /api/v1/auth/request-otp
POST   /api/v1/auth/verify-otp
POST   /api/v1/auth/refresh

GET    /api/v1/me

GET    /api/v1/workers/:id
PATCH  /api/v1/workers/me

POST   /api/v1/jobs
GET    /api/v1/jobs/:id
GET    /api/v1/jobs

POST   /api/v1/jobs/:id/publish
POST   /api/v1/jobs/:id/cancel

GET    /api/v1/worker/offers
POST   /api/v1/offers/:id/accept
POST   /api/v1/offers/:id/reject

POST   /api/v1/jobs/:id/start-travel
POST   /api/v1/jobs/:id/arrive
POST   /api/v1/jobs/:id/start
POST   /api/v1/jobs/:id/complete

POST   /api/v1/jobs/:id/reviews

GET    /api/v1/earnings/summary
POST   /api/v1/expenses

GET    /api/v1/notifications
```

---

## 44. API Response Format

Success:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

Failure:

```json
{
  "success": false,
  "error": {
    "code": "JOB_ALREADY_ASSIGNED",
    "message": "This job has already been accepted.",
    "requestId": "req_..."
  }
}
```

---

## 45. Request Validation

Use:

**Zod**

Validate:

- body
- params
- query
- uploaded metadata

Backend validation remains mandatory.

---

## 46. Pagination

Use cursor pagination:

```http
GET /api/v1/jobs?limit=20&cursor=xyz
```

---

## 47. Idempotency

Support `Idempotency-Key` for:

- job creation
- job acceptance
- payments
- refunds
- job completion
- webhook processing

---

## 48. MongoDB Index Strategy

Recommended:

```text
users.phoneNumber UNIQUE

workerProfiles.serviceLocation 2dsphere

workerProfiles.skills.skillId

jobs.customerId + createdAt

jobs.status + createdAt

jobOffers.workerId + status + createdAt

jobOffers.jobId + workerId UNIQUE

reviews.workerId + createdAt

transactions.workerId + createdAt

notifications.userId + read + createdAt
```

---

## 49. Transactions

Use MongoDB transactions where consistency across multiple documents is required.

Examples:

```text
Accept worker
+
Update job
+
Update job offer
+
Withdraw competing offers
```

---

## 50. Search

Use MongoDB Atlas Search for worker and service search.

Searchable fields may include:

- worker name
- skill
- category
- service description
- keywords
- locality

---

## 51. Location Privacy

Before job acceptance, expose:

- approximate locality
- distance
- general area

After confirmed assignment, expose the exact service address.

---

## 52. Security Requirements

Backend should include:

- Helmet
- Strict CORS allowlist
- Rate limiting
- Input validation
- Secure cookies
- TLS
- Authentication
- Authorization
- Request-size limits
- Upload limits
- Secret management
- Audit logs
- Security headers
- Dependency scanning
- Central error handling

---

## 53. Rate Limiting

Protect:

- OTP
- login
- job creation
- search
- expensive AI endpoints
- file uploads

Use Redis-backed limits in production.

---

## 54. Audit Logging

Audit:

- Admin suspension
- Worker verification
- Manual payment adjustment
- Dispute resolution
- Role change
- Account deletion
- Refund

Example:

```ts
AuditLog {
  actorId
  action
  resourceType
  resourceId
  before?
  after?
  ipAddress
  requestId
  createdAt
}
```

---

## 55. Privacy

Apply data minimization.

Provide mechanisms for:

- account deletion
- data correction
- consent management
- notification preferences
- location permissions
- retention policies

Obtain legal review before commercial launch.

---

## 56. Frontend Architecture

```text
app/
├── (public)/
├── (auth)/
├── customer/
├── worker/
└── admin/
```

Example routes:

```text
/customer
/customer/jobs
/customer/jobs/[id]
/customer/profile

/worker
/worker/offers
/worker/jobs
/worker/earnings
/worker/profile

/admin
/admin/users
/admin/workers
/admin/jobs
/admin/reports
```

---

## 57. Server vs Client Components

Default to Server Components.

Use Client Components for:

- maps
- realtime UI
- audio recording
- camera access
- browser APIs
- rich interactive forms

---

## 58. State Management

Use:

- URL state for filters
- local state for component state
- server-state tooling for API data
- Context for small cross-cutting concerns

If needed, use:

**TanStack Query**

---

## 59. PWA Requirements

Support:

- Manifest
- App icons
- Service worker
- Cached application shell
- Offline fallback
- Push notifications
- Add-to-home-screen

Offline actions must show pending state and sync safely.

---

## 60. Low-Bandwidth Design

Requirements:

- Minimize initial JS
- Compress responses
- Lazy-load non-critical UI
- Optimize images
- Generate thumbnails
- Avoid autoplay video
- Cache static assets
- Avoid duplicate downloads

---

## 61. Accessibility

Target:

**WCAG 2.2 AA where practical**

Use:

- Large touch targets
- Strong contrast
- Simple language
- Icons + labels
- Audio assistance
- Limited text
- Clear status messages

---

## 62. Notification System

Types:

```text
JOB_OFFER
JOB_ACCEPTED
WORKER_ARRIVING
WORKER_ARRIVED
JOB_STARTED
JOB_COMPLETED
PAYMENT_RECEIVED
REVIEW_RECEIVED
MESSAGE_RECEIVED
DISPUTE_UPDATE
```

Channels:

- In-app
- Push
- SMS
- Email
- WhatsApp later

---

## 63. Admin Dashboard

Metrics:

```text
Registered customers
Registered workers
Verified workers
Active workers
Jobs created
Jobs completed
Jobs cancelled
Match success rate
Average time to acceptance
Gross service value
Worker net earnings
Dispute rate
Repeat customer rate
```

---

## 64. Trust & Safety

Provide:

- Report user
- Block user
- Report unsafe job
- Worker verification
- Customer abuse detection
- Dispute mechanism
- Rating moderation
- Suspicious-behavior detection

---

## 65. Review System

Only participants in completed jobs may review each other.

Prevent duplicate reviews.

---

## 66. Observability

### Logging

Use:

**Pino**

Include:

```text
timestamp
level
requestId
userId where safe
route
statusCode
duration
```

Never log:

```text
OTP
password
authorization header
refresh token
sensitive documents
full payment credentials
```

---

## 67. Error Monitoring

Use:

**Sentry**

Track:

- frontend errors
- backend errors
- failed API requests
- releases
- source maps

---

## 68. Metrics

Monitor:

```text
request count
error rate
p50 latency
p95 latency
p99 latency
MongoDB latency
queue depth
failed jobs
WebSocket connections
OTP success rate
matching latency
notification delivery
```

---

## 69. Request IDs

Every request receives a `requestId`.

Propagate it through:

```text
Frontend
→ API
→ Queue
→ Worker
→ External service
```

where possible.

---

## 70. Performance Targets

### API

Normal reads:

```text
p95 < 300 ms
```

Normal writes:

```text
p95 < 500 ms
```

### Matching

```text
target < 3 seconds
```

### Availability

```text
99.9%
```

---

## 71. Frontend Performance

Target Core Web Vitals:

```text
LCP < 2.5 s
INP < 200 ms
CLS < 0.1
```

---

## 72. Caching

Cache:

- service categories
- skill definitions
- configuration
- translations
- public worker summaries where safe

Avoid aggressive caching for:

- job assignment state
- worker availability
- financial records
- payment state

---

## 73. Deployment Architecture

Recommended:

```text
Frontend
Vercel
   │
   ▼
Express API
Container Platform
   │
   ├──────── MongoDB Atlas
   ├──────── Redis
   ├──────── Object Storage
   └──────── Worker Service
```

The backend should remain container-compatible.

---

## 74. Development Environment

Use Docker Compose for:

- MongoDB
- Redis
- local infrastructure

Example:

```bash
docker compose up -d
pnpm dev
```

---

## 75. Environment Separation

Maintain:

```text
local
development
staging
production
```

Never point local development at production MongoDB.

---

## 76. Secrets

Examples:

```text
MONGODB_URI
REDIS_URL
JWT_PRIVATE_KEY
OTP_PROVIDER_KEY
MAPS_API_KEY
AI_PROVIDER_KEY
PAYMENT_WEBHOOK_SECRET
STORAGE_SECRET
```

Never commit these to Git.

---

## 77. CI/CD

Use GitHub Actions.

Pipeline:

```text
Install
↓
Lint
↓
Type check
↓
Unit tests
↓
Integration tests
↓
Build frontend
↓
Build backend
↓
Security checks
```

---

## 78. Branch Strategy

Recommended:

```text
main
feature/*
fix/*
```

Keep `main` deployable.

---

## 79. Testing Strategy

### Unit Tests

Test:

- matching scoring
- earnings calculations
- permissions
- state transitions
- pricing logic
- validation

### Integration Tests

Test:

- Express + MongoDB + Redis
- job race conditions
- transactions
- authentication
- refresh rotation
- duplicate reviews
- job state transitions

### End-to-End Tests

Use:

**Playwright**

Test complete customer and worker journeys.

---

## 80. Load Testing

Test at:

```text
500 concurrent users
1,000 concurrent users
5,000 concurrent users
```

Tools:

- k6
- Artillery

---

## 81. Backup and Recovery

MongoDB production database should include:

- automated backups
- point-in-time recovery where supported
- restore testing

Initial objectives:

```text
RPO ≤ 15 minutes
RTO ≤ 1 hour
```

---

## 82. Soft Deletion

Use `deletedAt` for important records unless policy/legal requirements require physical deletion.

Financial history must remain auditable.

---

## 83. API Documentation

Generate:

**OpenAPI 3.x**

Provide `/docs` for staging/internal environments.

---

## 84. Database Migration Strategy

Maintain migration scripts such as:

```text
001-add-worker-location-index
002-normalize-phone-numbers
003-add-job-state
```

---

## 85. Feature Flags

Examples:

```text
voice_onboarding
ai_job_classification
online_payments
worker_verification_v2
new_matching_algorithm
```

---

## 86. Analytics Events

Examples:

```text
signup_started
signup_completed

worker_onboarding_started
worker_onboarding_completed

job_created
job_published

job_offer_sent
job_offer_opened
job_offer_accepted
job_offer_rejected

job_started
job_completed

expense_added

review_created
```

---

## 87. Business Metrics

Important marketplace metrics:

```text
Job fill rate
Median time to acceptance
Job completion rate
Worker utilization
Repeat customer rate
Worker retention
Customer retention
Average job value
Worker net earnings/job
Worker net earnings/hour
Cancellation rate
Dispute rate
```

---

## 88. MVP Scope

### Customer

- Authentication
- Profile
- Location
- Create job
- Select service
- Job images
- View matched workers
- Job status
- Completion
- Rating

### Worker

- Authentication
- Worker profile
- Skills
- Service radius
- Availability
- Receive offers
- Accept/reject
- Job lifecycle
- Expense entry
- Earnings dashboard
- Reviews

### Platform

- Matching engine
- Notifications
- Realtime events
- MongoDB
- Redis
- Basic administration
- Audit logging

---

## 89. Hackathon-Level AI Features

Implement two AI features exceptionally well:

### Feature 1 — Voice Profile

Worker speaks about their trade, experience and service area.

System extracts structured profile data.

### Feature 2 — Voice Job Creation

Customer describes the problem verbally.

System extracts service category, urgency, description and timing.

---

## 90. Killer Demonstration Flow

```text
Customer
   ↓
Speaks problem
   ↓
System identifies service
   ↓
Job created
   ↓
MongoDB geospatial matching
   ↓
5 nearby workers discovered
   ↓
Worker receives local-language notification
   ↓
Worker accepts
   ↓
Customer sees worker assigned
   ↓
Worker reaches customer
   ↓
Job starts
   ↓
Job completed
   ↓
₹700 revenue
   ↓
Worker records:
₹100 fuel
₹150 materials
   ↓
Dashboard shows:

Revenue       ₹700
Expenses      ₹250
Net Earnings  ₹450
```

---

## 91. Phase 1 — Foundation

Build:

```text
Monorepo
Next.js
Express
MongoDB
Redis
Authentication
RBAC
Logging
Error handling
Validation
CI
```

---

## 92. Phase 2 — Worker Platform

Build:

```text
Worker onboarding
Worker profile
Skills
Location
Availability
Portfolio
Verification
```

---

## 93. Phase 3 — Job Marketplace

Build:

```text
Job creation
Job state machine
Geospatial matching
Job offers
Accept/reject
Notifications
```

---

## 94. Phase 4 — Job Execution

Build:

```text
Realtime status
Worker arrival
Start job
Complete job
Messaging
Reviews
```

---

## 95. Phase 5 — Financial Intelligence

Build:

```text
Revenue
Expenses
Transaction ledger
Net earnings
Earnings/hour
Weekly/monthly dashboard
```

---

## 96. Phase 6 — Voice and AI

Build:

```text
Voice onboarding
Job classification
Translation
Job simplification
Voice summaries
```

---

## 97. Phase 7 — Trust & Administration

Build:

```text
Verification
Reports
Disputes
Moderation
Admin dashboard
Audit system
```

---

## 98. Phase 8 — Production Hardening

Complete:

```text
Load testing
Security testing
Performance optimization
Database index analysis
Monitoring
Alerting
Backups
Disaster recovery
Rate limiting
Abuse protection
Accessibility review
```

---

## 99. Engineering Rules

1. TypeScript everywhere.
2. No business logic inside React components.
3. No business logic inside Express controllers.
4. No direct database access from controllers.
5. No MongoDB access from the browser.
6. No secret keys in frontend code.
7. Validate every API input.
8. Authorize every protected resource.
9. Never trust frontend-calculated prices or balances.
10. Never use floating point for money.
11. Never rely solely on AI for critical operations.
12. Never store files directly inside normal MongoDB documents.
13. Every major production error must be observable.
14. Every financial operation must be traceable.
15. Every administrative action must be auditable.
16. Critical mutations must be idempotent.
17. Job state changes must follow the state machine.
18. Backend remains the source of truth.

---

## 100. Definition of Production Ready

```text
✓ Authentication secured
✓ Authorization implemented
✓ Input validation everywhere
✓ Rate limiting
✓ CORS restrictions
✓ CSP/security headers
✓ MongoDB indexes verified
✓ Race conditions tested
✓ Financial calculations tested
✓ Payment webhooks verified
✓ Idempotency implemented
✓ Logging
✓ Error monitoring
✓ Metrics
✓ Backups
✓ Restore procedure
✓ CI/CD
✓ Automated tests
✓ Load testing
✓ Admin moderation
✓ Audit logs
✓ Privacy controls
✓ Mobile performance testing
✓ Slow-network testing
✓ Accessibility testing
```

---

## 101. Final Technical Architecture

```text
                    USERS
                      │
                      ▼
             ┌────────────────┐
             │ Next.js / React│
             │      PWA       │
             └───────┬────────┘
                     │
                 HTTPS API
                     │
                     ▼
          ┌───────────────────────┐
          │      Express.js       │
          │                       │
          │ Auth                  │
          │ Users                 │
          │ Workers               │
          │ Jobs                  │
          │ Matching              │
          │ Messaging             │
          │ Earnings              │
          │ Reviews               │
          │ Payments              │
          │ Admin                 │
          └───────┬─────┬─────────┘
                  │     │
            ┌─────▼─┐ ┌─▼─────┐
            │MongoDB│ │ Redis │
            │ Atlas │ │       │
            └───┬───┘ └──┬────┘
                │         │
                │      BullMQ
                │         │
                │    ┌────▼─────┐
                │    │ Workers  │
                │    └────┬─────┘
                │         │
      ┌─────────┼─────────┼─────────┐
      ▼         ▼         ▼         ▼
   Storage    Maps      Voice      AI
      │      Provider   Provider  Provider
      │
      ▼
     CDN
```

---

## 102. Recommended Core Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Web Framework | Next.js |
| UI | React |
| Backend | Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Validation | Zod |
| Cache | Redis |
| Queue | BullMQ |
| Realtime | Socket.IO |
| File Storage | S3/R2 compatible storage |
| API Style | REST `/api/v1` |
| API Docs | OpenAPI |
| Authentication | OTP + access/refresh session |
| Maps | Provider abstraction |
| AI | Provider abstraction |
| Push | FCM/Web Push |
| Logging | Pino |
| Error Monitoring | Sentry |
| Testing | Vitest/Jest + Supertest + Playwright |
| Load Testing | k6/Artillery |
| CI/CD | GitHub Actions |
| Frontend Hosting | Vercel |
| Backend | Containerized Express service |
| Database Hosting | MongoDB Atlas |

---

## 103. Final Product Positioning

The product should not be positioned merely as:

> "Uber for plumbers."

The stronger product definition is:

> **A voice-first hyperlocal work platform that helps India's skilled and semi-skilled workers discover nearby work, build a trusted digital reputation, manage jobs and understand what they actually earn.**

The technology architecture must reinforce that mission:

**Simple for the worker.**  
**Reliable for the customer.**  
**Traceable for the business.**  
**Maintainable for developers.**  
**Scalable for production.**
