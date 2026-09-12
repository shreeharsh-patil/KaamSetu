# KaamSetu Comprehensive Testing & Load Testing Guide

This document details the multi-tiered automated testing architecture, concurrency validation, and progressive load testing specifications for the KaamSetu platform.

---

## 1. Test Architecture Overview

KaamSetu utilizes a 4-tier testing hierarchy to guarantee correctness, concurrency safety, and performance under extreme load:

```
+-------------------------------------------------------------+
|                      Tier 4: Load Testing                   |
|       k6 Progressive Virtual Users (500 -> 1k -> 5k VUs)    |
+-------------------------------------------------------------+
|               Tier 3: High-Concurrency Stress               |
|      Race Conditions (50 simultaneous workers / job)       |
+-------------------------------------------------------------+
|               Tier 2: End-to-End & Integration              |
|        Full HTTP API, MongoDB, Redis, RBAC & Security       |
+-------------------------------------------------------------+
|                   Tier 1: Domain Unit Tests                  |
|     State Machine, Geospatial Scoring, Financial Math       |
+-------------------------------------------------------------+
```

---

## 2. Test Suite Catalog & Coverage

All 24 test suites reside in `apps/api/test/` and run under **Vitest**:

| Test Suite File | Coverage Scope | Key Assertions |
| :--- | :--- | :--- |
| [`concurrency-race-conditions.test.ts`](./apps/api/test/concurrency-race-conditions.test.ts) | **50 Concurrent Workers** accepting the same job simultaneously | **Exactly 1 success (200 OK)**, **49 conflicts (409 Conflict)**, zero duplicate assignments, atomic transition |
| [`job-state-machine.test.ts`](./apps/api/test/job-state-machine.test.ts) | Core finite state machine (152 tests) | Exhaustive matrix validation of every legal and illegal state transition |
| [`jobs.test.ts`](./apps/api/test/jobs.test.ts) | Job CRUD, publication, cancellation, completion | Domain method validation, state validation, actor permission boundaries |
| [`matching-offers.test.ts`](./apps/api/test/matching-offers.test.ts) | Geospatial candidate filtering & 7-factor scoring | Distance km, skill match, availability, rating, completion rate, price compatibility |
| [`auth.test.ts`](./apps/api/test/auth.test.ts) | Phone number + OTP authentication | OTP request, attempt limits, resend cooldown, session persistence |
| [`security-hardening.test.ts`](./apps/api/test/security-hardening.test.ts) | Phase 13 security defenses (31 tests) | NoSQL injection, HPP, 413 payload limits, rate limiting, IDOR, vertical privilege escalation |
| [`earnings-expenses-ledger.test.ts`](./apps/api/test/earnings-expenses-ledger.test.ts) | Financial double-entry ledger & aggregations | Strict integer-paise calculations, immutable transactions, expense voiding |
| [`admin-audit.test.ts`](./apps/api/test/admin-audit.test.ts) | Operational control & immutable audit trail | Admin vs Support RBAC, user suspension, verification decisions, append-only logs |
| [`trust-reviews-verification.test.ts`](./apps/api/test/trust-reviews-verification.test.ts) | Marketplace trust & safety | Completed job reviews, aggregate rating recalculation, reports, disputes |
| [`messaging-notifications.test.ts`](./apps/api/test/messaging-notifications.test.ts) | Conversations, messages, BullMQ queues | Job participant isolation, structured messages, read receipts |
| [`file-uploads.test.ts`](./apps/api/test/file-uploads.test.ts) | S3-compatible signed uploads & privacy | Presigned upload URLs, storage verification, private document protection |
| [`ai-speech-providers.test.ts`](./apps/api/test/ai-speech-providers.test.ts) | AI & Speech layer with circuit breaker | Fallback behavior when AI fails, timeout protection, structured Zod validation |
| [`profiles.test.ts`](./apps/api/test/profiles.test.ts) | Worker & customer marketplace identity | 2dsphere location indexing, service radius, skills taxonomy |
| [`audit-fixes.test.ts`](./apps/api/test/audit-fixes.test.ts) | Cross-phase regression suite | Worker job scoping, expense ledger sync, state event auditing |

---

## 3. Concurrency Invariants & Proof

### 50 Workers Competing on a Single Job
- **Problem**: When a high-demand job is dispatched to nearby workers in a notification wave, dozens of workers may tap "Accept" within the same millisecond.
- **Implementation**: The backend uses an atomic conditional find-and-modify operation inside MongoDB:
  ```typescript
  const assignedJobDoc = await JobModel.findOneAndUpdate(
    {
      _id: new Types.ObjectId(offer.jobId),
      status: { $in: [JobStatus.OPEN, JobStatus.MATCHING, JobStatus.OFFERED] },
      assignedWorkerId: null,
      deletedAt: null,
    },
    {
      $set: {
        status: JobStatus.ACCEPTED,
        assignedWorkerId: new Types.ObjectId(workerId),
      },
    },
    { new: true, session }
  ).exec();
  ```
- **Automated Proof**: Tested in [`concurrency-race-conditions.test.ts`](./apps/api/test/concurrency-race-conditions.test.ts):
  - 50 workers fire parallel HTTP `POST /api/v1/offers/:id/accept` requests via `Promise.all`.
  - **Result**: Exactly 1 response has `status: 200`, exactly 49 responses have `status: 409`.
  - Exactly 1 `OFFER_ACCEPTED` job event is emitted.
  - All other offers are withdrawn.

---

## 4. Progressive Load Testing (k6)

### Target Scale: 500 $\to$ 1,000 $\to$ 5,000 Concurrent Users

All k6 scenarios follow standard progressive stages:
1. **Ramp to 500 VUs** over 1 minute; hold for 2 minutes.
2. **Ramp to 1,000 VUs** over 1 minute; hold for 3 minutes.
3. **Ramp to 5,000 VUs** over 2 minutes; hold for 5 minutes.
4. **Cool-down to 0 VUs** over 1 minute.

### Production Performance Thresholds (SLOs)

| Metric | Target Threshold | Rationale |
| :--- | :--- | :--- |
| **p(95) Latency (Read Endpoints)** | `< 100ms` | Job searches, categories, worker profiles must feel instantaneous. |
| **p(95) Latency (Write Endpoints)** | `< 300ms` | Job creation, publishing, and ledger operations. |
| **p(99) Latency (All Traffic)** | `< 500ms` | Tail latency ceiling under peak concurrency. |
| **HTTP Failure Rate** | `< 1.0%` | Unhandled 5xx errors or network drops must remain under 1%. |
| **Offer Acceptance Under Load** | `200` or `409` | 409 Conflict is an expected business outcome for contested jobs. |

### Running Load Tests

```powershell
# 1. Baseline Health & Readiness
pnpm load-test:health

# 2. Authentication & Session Refresh
pnpm load-test:auth

# 3. High-Concurrency Job Listing & Search
pnpm load-test:jobs

# 4. Job Creation & Publishing
pnpm load-test:create

# 5. Concurrency Offer Acceptance
pnpm load-test:concurrency

# 6. Full 5,000-User End-to-End Marketplace Lifecycle
pnpm load-test
```

---

## 5. Running Automated Vitest Suites

```powershell
# Run all 24 test suites across the monorepo
pnpm test

# Run a specific test suite
pnpm --filter @kaamsetu/api test test/concurrency-race-conditions.test.ts

# Run with test coverage
pnpm test:coverage
```
