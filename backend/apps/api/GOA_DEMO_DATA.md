# Goa Demo Data

Development-only, deterministic seed that fills the database with a small but
functioning KaamSetu marketplace spread across Goa, India. Every person,
phone number and address is **synthetic** — names are invented, phone numbers
use the reserved `+91 99000 0xxx` test range, and address lines are generic
neighbourhood descriptions, never real residences.

## Commands

```bash
cd backend/apps/api

pnpm seed:goa          # insert/update the deterministic demo dataset (idempotent)
pnpm seed:goa:reset    # delete ONLY seed-owned records, then reseed
```

Both commands refuse to run when `NODE_ENV=production` unless
`ALLOW_GOA_SEED_IN_PROD=true` is also set (disposable environments only).

## Primary demo accounts

Log in with phone + OTP. In non-production the OTP is always `123456`
(dev-only behaviour; production generates random OTPs).

| Role     | Phone          | Name          | Location |
|----------|----------------|---------------|----------|
| Customer | +919900001001  | Demo Customer | Panaji   |
| Worker   | +919900002001  | Demo Plumber  | Panaji   |
| Admin    | +919900009001  | Demo Admin    | —        |

The demo customer has completed jobs (one reviewable), an active job in each
state from ACCEPTED through IN_PROGRESS, a pending offer, unread messages and
notifications, and two saved addresses (Home default in Panaji, Office).

The demo worker (plumber, Panaji) is AVAILABLE + VERIFIED, has a pending offer,
an accepted job, jobs in transit/arrival/in-progress states, 16 days of
completed history with reviews, earnings transactions and expenses.

## What gets seeded

| Collection | Count | Notes |
|---|---|---|
| Categories | 10 | Shared slugs with the base seed; upserted, never duplicated |
| Skills | 46 | Under their categories, deterministic slugs |
| Customers | 12 | Across Panaji, Porvorim, Mapusa, Calangute, Ponda, Margao, Vasco, Colva, Verna, Candolim, Canacona |
| Workers | 31 | Mix of AVAILABLE/BUSY/OFFLINE and VERIFIED/PENDING/UNVERIFIED |
| Jobs | 50 | Full lifecycle: 3 DRAFT, 4 OPEN, 4 MATCHING, 4 OFFERED, 4 ACCEPTED, 2 EN_ROUTE, 2 ARRIVED, 3 IN_PROGRESS, 16 COMPLETED, 3 CANCELLED, 2 EXPIRED, 1 DISPUTED (completed + dispute) |
| Job offers | ~30 | One ACCEPTED per assigned job, rivals REJECTED/WITHDRAWN/EXPIRED |
| Job events | ~180 | Chronological, coherent per-state histories |
| Conversations | 6 | Only for jobs with assignments; TEXT messages only |
| Reviews | 15 | Completed jobs only; worker rating aggregates recomputed to match |
| Expenses | 9 | Canonical categories (FUEL/MATERIAL/PARKING/TOOL), integer paise |
| Ledger rows | ~25 | JOB_REVENUE + EXPENSE mirrors, `goa-demo:` reference prefix |
| Notifications | 13 | Mix of read/unread, linked to real entities |
| Verification requests | 3 | PENDING workers, placeholder documents (never real IDs) |
| Disputes | 1 | OPEN, appliance job, valid parties |
| Reports | 1 | PENDING |
| Audit logs | 1 | VERIFICATION_APPROVED by demo admin |

## Matching test scenarios

The dataset deliberately exercises the real matching engine:

1. **Panaji plumber demo** — "Kitchen sink leaking" (TODAY). Demo Plumber
   (Panaji, ~1–3 km, AVAILABLE), Rohan Gaonkar (Porvorim, ~4–7 km), Sameer
   Kamat (Mapusa, farther), Sunil Gawas (Panaji, OFFLINE). Nearby eligible
   plumbers exist for ranking; matching is left to the real engine.
2. **Canacona radius expansion** — "Bathroom drain blocked". No plumber in
   Canacona itself within a small radius; Sachin Pagi is available with a
   25 km radius, letting you verify wave/radius expansion behaviour.
3. **No cleaning workers near Vasco** — a MATCHING job where no eligible
   worker exists nearby (Home Cleaning has only one worker, in Colva).
4. **Offline-but-offered** — worker 18 (Tukaram Gaude, OFFLINE) holds a
   PENDING offer, useful for offer-timeout UI tests.
5. **Expired jobs** — Canacona AC servicing and Colva fan repair that expired
   with no acceptances.

## Voice booking demo

The default customer's saved Panaji address prefills the booking wizard, and
categories/skills cover the phrase *"Book a plumber, my kitchen sink is
leaking and I need someone today."* → plumbing / pipe-leak-repair.

## How seeding identifies its own data

Every document gets a deterministic `_id` derived from
`sha256("GOA_DEMO_V1:<kind>:<key>")`. Re-running upserts the same ids (no
duplicates); reset recomputes the id/phone lists and deletes exactly those
records. Categories/skills are shared by slug with the base seed and are never
deleted by the reset. Non-seed data (any other user/job) is untouched — the
reset never uses `db.dropDatabase()` or unfiltered `deleteMany({})`.

## Databases

Reads `MONGODB_URI` from the environment. The runner prints the target
database name before seeding. **Never point this seed at a production
database** — the NODE_ENV guard is a safety net, not an excuse.

## Files

```
src/database/seeds/goa-demo/
├── goa-demo.seed.ts        # builder + validation pass + reset
├── goa-demo.runner.ts      # CLI entry (pnpm seed:goa / seed:goa:reset)
├── util.ts                 # deterministic ids, haversine, time helpers
└── seed-data/
    ├── goa-locations.ts    # town centroids [lng, lat] + jitter
    ├── categories.ts       # categories + skills
    ├── people.ts           # synthetic workers/customers/admin
    └── jobs.ts             # jobs, conversations, reviews, expenses
```
