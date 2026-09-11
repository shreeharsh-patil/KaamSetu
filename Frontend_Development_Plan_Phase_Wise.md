**Frontend Development Plan**

Next.js + React \| Phase-by-Phase Production Roadmap

**Hyperlocal Skilled-Worker Service Platform**

Frontend: Next.js 16.x + React 19.x + TypeScript

Architecture: App Router + API-driven frontend

Purpose: Production implementation plan with copy-ready Codex prompts

Version 1.0

# 1. Frontend Technical Baseline

This document defines the production frontend roadmap for the skilled-worker service platform. It is intentionally separated from the Express.js backend and should be implemented one phase at a time.

| Layer        | Technology                                  |
|--------------|---------------------------------------------|
| Framework    | Next.js 16.x App Router                     |
| UI runtime   | React 19.x                                  |
| Language     | TypeScript (strict)                         |
| Styling      | Tailwind CSS                                |
| Components   | shadcn/ui + Radix UI                        |
| Icons        | Lucide                                      |
| Server state | TanStack Query                              |
| Forms        | React Hook Form + Zod                       |
| Realtime     | Socket.IO Client                            |
| i18n         | next-intl                                   |
| PWA          | Service Worker + Web Manifest               |
| Testing      | Vitest + React Testing Library + Playwright |
| Monitoring   | Sentry                                      |

## Frontend must be

- Mobile-first

- Accessible

- Fast

- Low-bandwidth friendly

- Multilingual

- Voice-friendly

- PWA-ready

- Role-aware

- API-driven

- Production maintainable

## Frontend must not

- Contain backend business logic

- Directly access MongoDB

- Calculate authoritative financial balances

- Decide job assignments

- Treat client-side authorization as security

- Store long-lived refresh credentials in localStorage

- Depend on AI for basic workflows

app/  
├── (public)/  
├── (auth)/  
├── customer/  
├── worker/  
└── admin/

# 2. Implementation Rules

1.  Server Components by default; use Client Components only when browser interactivity requires them.

2.  Express.js remains the backend authority. The frontend consumes /api/v1/\*.

3.  Do not access MongoDB from Next.js.

4.  Do not hardcode backend secrets into NEXT_PUBLIC\_\* variables.

5.  All asynchronous screens require loading, success, empty, and error states.

6.  Every mutation needs a clear pending state and duplicate-submission protection.

7.  AI and voice are enhancements; all critical flows require manual fallbacks.

8.  Worker/customer workflows are designed phone-first.

9.  Maps and other heavy browser-only features must be lazy loaded.

10. Frontend role checks improve UX only; backend authorization remains authoritative.

# Phase 0 — Frontend Foundation

**Goal:** Create a clean production Next.js application before implementing product screens.

## Core structure

apps/web/src/  
├── app/  
│ ├── layout.tsx  
│ ├── page.tsx  
│ ├── loading.tsx  
│ ├── error.tsx  
│ ├── not-found.tsx  
│ ├── (public)/  
│ ├── (auth)/  
│ ├── customer/  
│ ├── worker/  
│ └── admin/  
├── components/  
│ ├── ui/  
│ ├── layout/  
│ ├── feedback/  
│ └── shared/  
├── features/  
├── hooks/  
├── lib/  
├── providers/  
├── styles/  
├── types/  
└── config/

## Configure

- TypeScript strict mode

- Tailwind CSS

- ESLint

- Prettier

- absolute imports

- environment validation

- error/loading boundaries

- metadata defaults

- font optimization

## Environment

- NEXT_PUBLIC_API_URL

- NEXT_PUBLIC_APP_URL

- NEXT_PUBLIC_SOCKET_URL

- NEXT_PUBLIC_MAP_PROVIDER

- NEXT_PUBLIC_SENTRY_DSN

## Acceptance

- Production build passes

- TypeScript and ESLint pass

- No console errors

- Environment validation works

- 404/loading/error/unauthorized/offline states exist

**Copy Prompt — Phase 0**

You are a senior frontend engineer.  
  
Build Phase 0 of a production-grade frontend for a hyperlocal skilled-worker marketplace.  
  
Stack:  
- Next.js 16 App Router  
- React 19  
- TypeScript strict mode  
- Tailwind CSS  
- shadcn/ui  
- Radix UI  
- Lucide icons  
  
Backend already exists separately using Express.js. Do NOT implement backend logic.  
  
Create a scalable frontend architecture under apps/web/src with route groups for public, auth, customer, worker and admin experiences.  
  
Implement:  
1. Root layout and global CSS.  
2. Strict TypeScript, ESLint and Prettier.  
3. Absolute import aliases.  
4. Environment variable validation.  
5. Global loading, error, not-found, unauthorized, forbidden and offline states.  
6. Base metadata and optimized fonts.  
7. Provider architecture placeholders.  
8. Responsive container primitives.  
  
Rules:  
- no backend logic  
- no MongoDB  
- no hardcoded API URLs  
- Server Components by default  
- use "use client" only where required  
- semantic accessible HTML  
  
Do not build login or role-specific pages yet.  
  
At the end show folder structure, dependencies and environment variables, then run typecheck, lint and production build and fix all errors.

# Phase 1 — Design System and UI Foundation

**Goal:** Create one reusable, accessible design system before feature screens.

## Design direction

- Simple

- Trustworthy

- Human

- Professional

- Accessible

- Local-service focused

- Modern without generic AI styling

## Avoid

- Excessive gradients

- Glassmorphism everywhere

- Random glowing cards

- Huge rounded containers everywhere

- Unnecessary animation

- Tiny text

- Icon-only critical actions

## Tokens

- backgrounds/foregrounds

- primary/secondary

- muted/borders

- success/warning/destructive/info

- spacing/radius/shadows

- typography

- motion

- z-index

## Primitives

- Button

- IconButton

- Input

- Textarea

- Select

- Checkbox

- Radio

- Switch

- Badge

- Avatar

- Card

- Dialog

- Drawer

- BottomSheet

- Tabs

- Tooltip

- Toast

- Skeleton

- Progress

- Separator

## Product components

- AppShell

- PageContainer

- PageHeader

- MobileHeader

- DesktopHeader

- BottomNavigation

- Section

- EmptyState

- ErrorState

- LoadingState

- StatusBadge

- RatingDisplay

- PriceDisplay

- DistanceDisplay

- ConfirmDialog

- LanguageSelector

**Copy Prompt — Phase 1**

Continue the frontend.  
  
Build Phase 1: production design system and reusable UI foundation.  
  
Use Tailwind CSS, shadcn/ui, Radix UI and Lucide icons.  
  
Create semantic CSS-variable tokens for colors, spacing, typography, radii, shadows and motion.  
Create reusable form, feedback, overlay and navigation primitives plus product components such as AppShell, PageHeader, BottomNavigation, StatusBadge, RatingDisplay, PriceDisplay and LanguageSelector.  
  
Requirements:  
- mobile-first  
- WCAG-conscious contrast  
- keyboard navigation and visible focus  
- comfortable touch targets  
- responsive typography  
- consistent spacing  
- no generic gradient-heavy AI styling  
- semantic HTML  
  
Do not build product features yet. Run accessibility checks where possible, then typecheck, lint and build.

# Phase 2 — API Client and Server-State Architecture

**Goal:** Create one reliable communication layer between Next.js and Express.

## API structure

src/lib/api/  
├── client.ts  
├── server.ts  
├── errors.ts  
├── endpoints.ts  
└── query-keys.ts

## Responsibilities

- base URL

- credentials

- headers/request IDs

- JSON parsing

- timeouts/AbortController

- 401 handling

- error normalization

- safe retry policy

## Server state

- TanStack Query for client-side cached server state

- Central query keys

- Predictable invalidation

- Do not use it for every Server Component

**Copy Prompt — Phase 2**

Continue the frontend.  
  
Build Phase 2: API client and server-state architecture.  
  
Backend base path: NEXT_PUBLIC_API_URL + /api/v1  
  
Create typed API client/server helpers, standardized ApiError, endpoint constants and centralized query keys.  
Implement credentials support, JSON/204 handling, request timeout, AbortController, request ID extraction, network errors and authentication failure handling.  
  
Configure TanStack Query with sensible stale times and retry behavior. Do not retry validation errors, auth failures, payments or job-accept mutations blindly.  
  
Do not scatter raw fetch calls across components.  
  
Add tests for success, validation error, network failure, timeout, unauthorized and empty response. Run typecheck, lint, tests and build.

# Phase 3 — Authentication Frontend

**Goal:** Build production-quality phone OTP authentication.

## Routes

- /login

- /verify-otp

## Flow

Phone → Request OTP → Verify → Fetch /me → Role redirect

## Role redirects

- CUSTOMER → /customer

- WORKER → /worker

- ADMIN/SUPPORT → /admin

## OTP UX

- auto focus/advance

- paste full OTP

- numeric keyboard

- resend countdown

- invalid/expired/rate-limit/network states

- change phone number

**Copy Prompt — Phase 3**

Continue the frontend.  
  
Build Phase 3: phone OTP authentication frontend.  
  
Backend endpoints:  
POST /api/v1/auth/request-otp  
POST /api/v1/auth/verify-otp  
POST /api/v1/auth/refresh  
POST /api/v1/auth/logout  
GET /api/v1/me  
  
Create /login and /verify-otp with India-appropriate phone input, OTP auto-advance, complete paste support, resend countdown and strong error/loading states.  
After login, fetch current user and redirect by role.  
  
Do not store long-lived refresh tokens in localStorage. Frontend route guards are UX only; backend remains authoritative.  
Add tests for login and error states and run all checks.

# Phase 4 — Role-Based Application Shells

**Goal:** Create distinct navigation experiences for customer, worker, admin and support.

## Customer nav

- Home

- Jobs

- Messages

- Profile

## Worker nav

- Home

- Offers

- Jobs

- Earnings

- Profile

## Admin nav

- Overview

- Users

- Workers

- Jobs

- Verifications

- Reports

- Disputes

- Categories

- Audit

## UX states

- unauthorized

- suspended

- incomplete onboarding

- offline

**Copy Prompt — Phase 4**

Continue the frontend.  
  
Build Phase 4: role-based application shells and navigation.  
  
Customer mobile navigation: Home, Jobs, Messages, Profile.  
Worker mobile navigation: Home, Offers, Jobs, Earnings, Profile.  
Admin navigation: Overview, Users, Workers, Jobs, Verifications, Reports, Disputes, Categories, Audit Logs.  
  
Requirements: mobile-first customer/worker layout, safe-area support, desktop navigation, active route indicators, accessible labels and responsive behavior.  
Create UX states for unauthorized, suspended, incomplete onboarding and disconnected network.  
Use current user role only for navigation/UX; backend remains the security boundary.  
Do not build page contents beyond placeholders.

# Phase 5 — Worker Onboarding

**Goal:** Build a low-friction, mobile-first onboarding flow for workers.

## Steps

- Welcome

- Language

- Name/Profile

- Skills

- Experience

- Location

- Service radius

- Pricing

- Availability

- Portfolio (optional)

- Review

- Complete

## UX

- progress

- back/next

- save/resume

- large touch targets

- visual skill cards

- minimal typing

## Location

- current location

- permission explanation

- map confirmation

- manual fallback

- service radius selector

**Copy Prompt — Phase 5**

Continue the frontend.  
  
Build Phase 5: worker onboarding.  
  
Implement a mobile-first wizard for language, profile, skills, experience, service location, service radius, pricing, availability, optional portfolio, review and completion.  
  
Requirements:  
- progress indicator  
- back/next  
- prevent accidental loss  
- resume incomplete onboarding  
- simple language and large touch targets  
- minimal typing and visual skill selection  
- validation per step  
- geolocation requested only when required with manual fallback  
- map confirmation and radius selection  
  
Use React Hook Form + Zod where appropriate. Persist at sensible checkpoints, not on every keystroke. Do not add voice onboarding yet.  
Test completion, validation, back navigation, refresh/resume, denied location permission and API errors.

# Phase 6 — Worker Dashboard and Availability

**Goal:** Create the worker daily operating screen.

## Priority

- availability

- active job

- new offers

- upcoming jobs

- today earnings

- important notifications

## Availability

- AVAILABLE

- BUSY

- OFFLINE

## States

- loading

- empty

- error/retry

- slow network

- offline

**Copy Prompt — Phase 6**

Continue the frontend.  
  
Build Phase 6: worker dashboard and availability UX.  
  
Create /worker with priority order: availability status, active job, new offers, upcoming jobs, today revenue/net earnings and important notifications.  
Avoid a generic analytics dashboard.  
  
Implement AVAILABLE/BUSY/OFFLINE controls, active-job card, offer summary, next job, earnings summary, skeletons, empty and retry states.  
Use optimistic UI only when rollback is correct.  
Ensure the screen behaves clearly on slow or disconnected networks. Mobile-first. Run tests and build.

# Phase 7 — Customer Home and Job Creation

**Goal:** Make creating a service request faster than searching worker listings.

## Job flow

- Select service

- Describe problem

- Add images

- Select location

- Choose timing

- Urgency

- Review

- Publish

## Location

- current location

- saved address

- add address

- map pin/manual fallback

## Requirements

- draft protection

- image previews/upload progress

- validation

- backend errors

- slow-network states

**Copy Prompt — Phase 7**

Continue the frontend.  
  
Build Phase 7: customer home and job creation.  
  
Display service categories from the backend. Create /customer/jobs/new with category, description, optional images, location/address, preferred date/time, urgency, review and publish.  
  
Support draft preservation where the backend allows it, image preview/removal/upload progress, current location, saved addresses, manual address fallback and map confirmation.  
Do not add AI classification or voice yet.  
After publish, redirect to matching/job status. Add tests.

# Phase 8 — Job Matching and Worker Offers

**Goal:** Build both sides of real backend matching.

## Customer states

- SEARCHING

- WORKERS_FOUND

- WAITING_FOR_ACCEPTANCE

- WORKER_ASSIGNED

- NO_WORKERS

- EXPIRED

## Worker offer

- service/category

- approximate locality

- distance

- description

- time

- urgency

- estimated price/range

- expiry countdown

- accept/decline

## Concurrency UX

- Handle JOB_ALREADY_ASSIGNED explicitly

- No fake optimistic success

**Copy Prompt — Phase 8**

Continue the frontend.  
  
Build Phase 8: customer matching state and worker job offers.  
  
Customer matching screen must represent real backend states: SEARCHING, WORKERS_FOUND, WAITING_FOR_ACCEPTANCE, WORKER_ASSIGNED, NO_WORKERS, EXPIRED. Do not fake matching with timers.  
  
Create /worker/offers and /worker/offers/\[offerId\]. Show category, approximate locality, distance, description, preferred time, urgency, price/range and expiration. Do not expose exact private customer address before authorization.  
  
Handle accept mutation carefully. If backend returns JOB_ALREADY_ASSIGNED show: "This job has already been taken." Disable repeated submissions and wait for confirmed backend assignment before showing success. Add full loading/error/empty/expired states and tests.

# Phase 9 — Active Job Lifecycle

**Goal:** Create the real-time accepted-job workflow from assignment to completion.

## Worker progression

ACCEPTED → EN_ROUTE → ARRIVED → IN_PROGRESS → COMPLETED

## Customer view

- assigned worker

- photo/rating/skills

- status/timeline

- authorized location

- message action

- allowed cancellation

## Routes

- /customer/jobs/\[jobId\]

- /worker/jobs/\[jobId\]

**Copy Prompt — Phase 9**

Continue the frontend.  
  
Build Phase 9: active job lifecycle.  
  
Routes: /customer/jobs/\[jobId\] and /worker/jobs/\[jobId\].  
Worker UI must render valid next actions only: Start travel, I've arrived, Start work, Complete job according to backend state. Never let UI arbitrarily patch status; use explicit action endpoints.  
  
Customer UI shows assigned worker, rating, skills, job status, timeline, authorized location, messaging and permitted cancellation.  
Create reusable JobTimeline. Handle cancelled/expired/disputed jobs, failed mutations and stale data. Use realtime updates when available with query invalidation/revalidation fallback. Test all states.

# Phase 10 — Realtime, Notifications and Messaging

**Goal:** Add one centralized realtime layer and job-scoped messaging.

## Socket events

- job.offer.created

- job.accepted

- job.status.changed

- job.completed

- message.created

- notification.created

## Messaging types

- TEXT

- IMAGE

- LOCATION

- SYSTEM

## Reliability

- single socket instance

- cache update/invalidation

- deduplication

- reconnecting/offline states

**Copy Prompt — Phase 10**

Continue the frontend.  
  
Build Phase 10: realtime updates, notifications and messaging using Socket.IO client.  
Create exactly one centralized authenticated socket connection. Do not instantiate sockets in individual pages.  
  
On events, update or invalidate relevant TanStack Query caches instead of creating a second drifting state store.  
Build notification center with unread count, mark-read and deep links.  
Build customer/worker conversation routes supporting TEXT, IMAGE, LOCATION and SYSTEM messages, cursor pagination, older-message loading, sending/failed/retry states, timestamps and deduplication.  
Add connected/reconnecting/offline states. Test socket cleanup to prevent duplicate listeners.

# Phase 11 — Earnings and Expenses

**Goal:** Make true earnings a core worker value proposition.

## Metrics

- Gross revenue

- Expenses

- Net earnings

- Jobs completed

- Hours worked

- Earnings/hour

## Periods

- Today

- Week

- Month

- Custom

## Expense fields

- job (optional)

- category

- amount

- note

- receipt

## Money rule

Frontend formats backend integer smallest-unit amounts with one shared formatMoney utility; backend totals remain authoritative.

**Copy Prompt — Phase 11**

Continue the frontend.  
  
Build Phase 11: worker earnings and expense tracking.  
  
Create /worker/earnings with gross revenue, expenses, net earnings, completed jobs, hours worked and effective earnings/hour. Support Today, Week, Month and custom range.  
Create expense entry for optional job, category, amount, note and receipt.  
  
Backend returns money in integer smallest currency units. Create one shared formatMoney(amount, currency) utility. Never use frontend calculations as authoritative financial totals.  
Include summary, recent transactions, expense breakdown and job earnings list with empty/loading/error/date-range states. Add tests for currency formatting and UI states.

# Phase 12 — Profiles, Reviews and Reputation

**Goal:** Create a safe public worker profile and verified review flow.

## Public fields

- name/photo

- verification badge

- skills/experience

- languages

- rating/review count

- completed jobs

- portfolio

- approximate service area

- public pricing

## Private fields to hide

- phone

- exact private address

- verification documents

- moderation metadata

## Review fields

- overall rating

- quality

- punctuality

- communication

- comment

**Copy Prompt — Phase 12**

Continue the frontend.  
  
Build Phase 12: public worker profiles and reviews.  
  
Create /workers/\[workerId\] showing only backend-approved public fields. Never expose private phone, precise private location, verification documents or internal moderation data.  
Create review flow only when backend marks a completed job reviewable, with rating, quality, punctuality, communication and optional comment.  
Handle already-reviewed/not-eligible/validation states and paginate review history. Add tests.

# Phase 13 — Multilingual UI

**Goal:** Make regional-language support foundational.

## Initial languages

- English

- Hindi

- Konkani

- Marathi

## Architecture

Use next-intl or compatible i18n; keep static interface translations separate from user-generated content translation.

## Requirements

- persistent language preference

- locale-aware dates/numbers/currency

- pluralization

- long-text layout resilience

- map enums to localized labels

**Copy Prompt — Phase 13**

Continue the frontend.  
  
Build Phase 13: multilingual frontend architecture.  
  
Initial languages: English, Hindi, Konkani and Marathi.  
Use next-intl or compatible localization architecture with structured message files. Do not hardcode visible UI strings throughout components.  
Support language selection, persistence, locale-aware dates/numbers/currency and pluralization.  
Keep static UI translation separate from user-generated content translation. Do not send normal UI strings to AI.  
Ensure layouts tolerate longer translations and map backend enums to localized labels. Test core flows in every supported language.

# Phase 14 — Voice-First Frontend

**Goal:** Add voice as an enhancement after manual flows work.

## Recorder states

- IDLE

- REQUESTING_PERMISSION

- RECORDING

- PROCESSING

- SUCCESS

- ERROR

## Worker voice

- describe profession/skills/experience/service area

- preview extracted profile

- confirm/edit before save

## Customer voice

- describe problem

- preview extracted category/problem/urgency/timing

- confirm before publish

## Fallbacks

- permission denied

- no microphone

- empty recording

- provider timeout

- invalid AI response

- manual entry

**Copy Prompt — Phase 14**

Continue the frontend.  
  
Build Phase 14: voice-first UX without replacing manual flows.  
  
Create reusable voice recorder with permission handling, recording indicator, timer, cancel/stop/retry, size limits and unsupported-browser fallback.  
Worker onboarding can send audio/transcript to backend and must show extracted profile for confirmation/editing before save.  
Customer job creation can send voice and must show extracted category/problem/urgency/timing for confirmation before publish.  
Never silently apply AI-generated critical information. Handle denied microphone, no microphone, empty recording, provider timeout and invalid response. Add tests with mocked browser APIs where possible.

# Phase 15 — Maps, Location and Navigation UX

**Goal:** Create robust location experiences without coupling the app to one maps vendor.

## Components

- Map

- LocationPicker

- AddressSearch

- CurrentLocationButton

- ServiceRadiusMap

- JobLocationPreview

## Privacy

- Before assignment: approximate locality/distance only

- After authorization: exact service location/navigation

## Performance

- lazy-load map code

- do not load maps on irrelevant pages

**Copy Prompt — Phase 15**

Continue the frontend.  
  
Build Phase 15: map and location UX using a provider-independent component interface.  
Create Map, LocationPicker, AddressSearch, CurrentLocationButton, ServiceRadiusMap and JobLocationPreview.  
  
Requirements: lazy loading, current-location permission handling, manual fallback, draggable/confirmable location where appropriate, mobile touch support and clear loading/error states.  
Worker flow shows service radius; customer flow selects service location.  
Respect backend privacy: approximate area before assignment, exact address only after authorization. Do not unnecessarily expose coordinates in UI or logs. Optimize map bundle size.

# Phase 16 — PWA and Low-Bandwidth Experience

**Goal:** Make the application installable and resilient on weak networks.

## PWA

- manifest

- icons

- service worker

- offline route/shell

- install readiness

- update handling

## Offline rule

Never pretend critical network actions succeeded. Job acceptance/completion, payments and financial operations require confirmed backend response.

## Optimize

- JS bundle

- images

- maps

- fonts

- API waterfalls

- third-party scripts

**Copy Prompt — Phase 16**

Continue the frontend.  
  
Build Phase 16: PWA and low-bandwidth support.  
Implement web manifest, icons, service worker, offline route, install readiness and update handling.  
Create clear network status UX. Preserve safe drafts locally when offline but never pretend critical operations succeeded.  
Critical operations such as accept job, start/complete job, payments and financial actions must require confirmed backend response.  
Optimize JS, images, maps, fonts, API waterfalls and third-party scripts. Test with throttled slow network conditions.

# Phase 17 — Admin Frontend

**Goal:** Build an operational dashboard rather than a decorative CRUD panel.

## Routes

- /admin

- /admin/users

- /admin/workers

- /admin/jobs

- /admin/verifications

- /admin/reports

- /admin/disputes

- /admin/categories

- /admin/skills

- /admin/audit

## Capabilities

- search/filter

- cursor pagination

- status filters

- detail views/drawers

- verification/dispute workflows

## Sensitive actions

- suspend/restore

- approve/reject verification

- resolve dispute

- modify categories

**Copy Prompt — Phase 17**

Continue the frontend.  
  
Build Phase 17: admin/support frontend.  
Create operational routes for overview, users, workers, jobs, verifications, reports, disputes, categories, skills and audit logs.  
Use backend-driven search/filtering and cursor pagination. Do not load full datasets client-side.  
Build verification and report/dispute review workflows. Sensitive actions must require confirmation and reason where required.  
Support role must only see actions allowed by the API; handle 403 correctly. Hidden buttons are not authorization. Add tests for admin/support role differences.

# Phase 18 — Accessibility and Responsive Hardening

**Goal:** Audit the entire frontend for real target devices and users.

## Test sizes

- 320

- 360

- 390

- 430

- 768

- 1024

- 1440

## Accessibility

- semantic HTML/headings

- labels

- form errors

- screen-reader announcements

- keyboard/focus

- dialog focus management

- contrast

- touch targets

- reduced motion

- 200% zoom

- text overflow

## Worker/customer UX

One-handed phone use must remain practical; do not hide required functionality on mobile.

**Copy Prompt — Phase 18**

Continue the frontend.  
  
Build Phase 18: complete accessibility and responsive hardening pass.  
Target WCAG 2.2 AA where practical.  
Audit semantic HTML, headings, labels, form errors, screen-reader announcements, keyboard navigation, focus management, contrast, touch targets, reduced motion, 200% zoom and translated-text overflow.  
Test 320, 360, 390, 430, 768, 1024 and 1440 widths plus keyboard-only and basic screen-reader flows.  
Fix horizontal overflow/layout shift. Do not solve mobile by hiding necessary features. Document remaining accessibility limitations.

# Phase 19 — Frontend Performance Optimization

**Goal:** Measure and optimize the application for real mobile devices.

## Targets

- LCP \< 2.5s

- INP \< 200ms

- CLS \< 0.1 where achievable

## Audit

- bundle size

- client-component count

- API/render waterfalls

- images/fonts

- map bundle

- hydration

- re-renders

- third-party scripts

## Techniques

- Server Components

- dynamic imports

- route-level splitting

- image/font optimization

- Suspense/streaming

- lazy maps

- pagination/virtualization where justified

**Copy Prompt — Phase 19**

Continue the frontend.  
  
Build Phase 19: production performance optimization.  
Profile before changing code. Audit JS bundle, Client Components, rendering/API waterfalls, duplicate requests, images, fonts, maps, Socket.IO lifecycle, hydration, re-renders and third-party scripts.  
Prefer Server Components where possible and dynamic imports for maps, rich charts, voice recorder and heavy admin tools.  
Measure Core Web Vitals with targets LCP \<2.5s, INP \<200ms and CLS \<0.1 where realistic. Test production build under mobile CPU/network throttling and document remaining bottlenecks.

# Phase 20 — Frontend Security Hardening

**Goal:** Reduce browser-side security and privacy risks.

## Review

- XSS/untrusted HTML

- token storage

- open redirects

- URL params

- file previews

- third-party scripts

- public env vars

- error messages/logging

- CSP compatibility

## Never

- store refresh tokens in localStorage

- trust frontend role checks

- calculate authoritative money client-side

- expose private API fields

- use dangerouslySetInnerHTML with untrusted input

**Copy Prompt — Phase 20**

Continue the frontend.  
  
Build Phase 20: frontend security hardening.  
Audit XSS risks, dangerouslySetInnerHTML, user-generated content rendering, token handling, local/session storage, open redirects, URL parameters, file previews, external links, third-party scripts, public environment values, errors and console logging.  
  
Rules:  
- no secrets in NEXT_PUBLIC variables  
- never store refresh tokens in localStorage  
- safely render untrusted user content  
- do not trust frontend authorization  
- do not calculate authoritative pricing/earnings client-side  
- do not leak private API fields  
  
Review CSP compatibility and remove sensitive production console logging. Create FRONTEND_SECURITY.md.

# Phase 21 — Frontend Testing

**Goal:** Protect critical customer, worker and admin journeys.

## Unit

- formatMoney

- dates

- API error mapping

- validation

- route helpers

- query utilities

## Components

- phone/OTP

- availability

- offer card

- job action states

- expense form

- language selector

- dialogs

## E2E customer

Login → create/publish job → worker assigned → track → complete → review

## E2E worker

Login → onboarding → available → offer → accept → travel → arrive → work → complete → expense → earnings

## E2E admin

Login → review verification → approve/reject → inspect audit result

**Copy Prompt — Phase 21**

Continue the frontend.  
  
Build Phase 21: comprehensive frontend tests with Vitest, React Testing Library and Playwright.  
Cover utility logic, core components and full customer/worker/admin workflows.  
Test mobile and desktop, API failures, network delays, unauthorized responses, expired sessions and no-data states. Do not test only happy paths.  
Run the full suite and fix all failures.

# Phase 22 — Monitoring, Analytics and Production Release

**Goal:** Make frontend failures and product funnels visible after deployment.

## Monitoring

- Sentry for unhandled/render/route errors and important failed operations

- redact sensitive data

## Analytics events

- signup_started/completed

- worker_onboarding_started/completed

- job_creation_started

- job_created/published

- offer_opened/accepted/rejected

- job_started/completed

- expense_added

- review_submitted

## Environments

- Preview

- Staging

- Production

## Release gate

- typecheck

- lint

- tests

- Playwright

- production build

- remove debug logs/test data/mock APIs/temp flags

**Copy Prompt — Phase 22**

Continue the frontend.  
  
Build Phase 22: production monitoring, analytics and release readiness.  
Integrate Sentry with release metadata while redacting sensitive information.  
Create an AnalyticsService/provider abstraction and implement only meaningful funnel events such as signup, onboarding, job creation/publish, offer actions, job start/completion, expense and review.  
Do not scatter vendor calls throughout components.  
Prepare preview/staging/production environments with correct variables.  
Run final typecheck, lint, tests, Playwright and production build. Remove debug logs, test data, development-only routes, mock APIs and temporary flags. Create RELEASE_CHECKLIST.md.

# Final Frontend Build Order

- Phase 0: Frontend Foundation

- Phase 1: Design System and UI Foundation

- Phase 2: API Client and Server-State Architecture

- Phase 3: Authentication Frontend

- Phase 4: Role-Based Application Shells

- Phase 5: Worker Onboarding

- Phase 6: Worker Dashboard and Availability

- Phase 7: Customer Home and Job Creation

- Phase 8: Job Matching and Worker Offers

- Phase 9: Active Job Lifecycle

- Phase 10: Realtime, Notifications and Messaging

- Phase 11: Earnings and Expenses

- Phase 12: Profiles, Reviews and Reputation

- Phase 13: Multilingual UI

- Phase 14: Voice-First Frontend

- Phase 15: Maps, Location and Navigation UX

- Phase 16: PWA and Low-Bandwidth Experience

- Phase 17: Admin Frontend

- Phase 18: Accessibility and Responsive Hardening

- Phase 19: Frontend Performance Optimization

- Phase 20: Frontend Security Hardening

- Phase 21: Frontend Testing

- Phase 22: Monitoring, Analytics and Production Release

## Recommended Git Commit Sequence

chore: bootstrap nextjs frontend  
feat: add design system  
feat: add api client architecture  
feat: implement otp authentication  
feat: add role based app shells  
feat: implement worker onboarding  
feat: add worker dashboard  
feat: implement customer job creation  
feat: add worker offers and matching ui  
feat: implement active job workflow  
feat: add realtime messaging  
feat: add earnings and expenses  
feat: add worker profiles and reviews  
feat: add multilingual support  
feat: add voice workflows  
feat: add location and maps  
feat: add pwa support  
feat: add admin dashboard  
fix: improve accessibility and responsiveness  
perf: optimize frontend performance  
security: harden frontend  
test: add comprehensive frontend tests  
chore: prepare production release

## Final Frontend Structure

apps/web/src/  
├── app/  
│ ├── (public)/  
│ ├── (auth)/  
│ ├── customer/  
│ ├── worker/  
│ ├── workers/\[workerId\]/  
│ └── admin/  
├── components/  
│ ├── ui/  
│ ├── layout/  
│ ├── feedback/  
│ ├── maps/  
│ ├── voice/  
│ └── shared/  
├── features/  
│ ├── auth/  
│ ├── customer/  
│ ├── workers/  
│ ├── jobs/  
│ ├── offers/  
│ ├── messaging/  
│ ├── earnings/  
│ ├── reviews/  
│ ├── notifications/  
│ ├── location/  
│ └── admin/  
├── hooks/  
├── lib/  
│ ├── api/  
│ ├── auth/  
│ ├── analytics/  
│ ├── socket/  
│ ├── i18n/  
│ ├── money/  
│ ├── dates/  
│ └── utils/  
├── providers/  
├── messages/  
├── styles/  
├── config/  
└── types/

## Definition of Frontend Production Ready

- [x] Responsive on common phone sizes

- [x] Worker onboarding works end-to-end

- [x] Customer job creation works end-to-end

- [x] Matching/offers work

- [x] Job lifecycle works

- [x] Realtime reconnects correctly

- [x] Messaging works

- [x] Earnings uses backend totals

- [x] Location and voice permission failures have fallbacks

- [x] Multilingual UI works

- [x] PWA installs correctly

- [x] Offline state is clear

- [x] Session expiry/unauthorized routes handled

- [x] Loading/empty/error states exist

- [x] Duplicate submissions prevented

- [x] Accessibility audit completed

- [x] Core Web Vitals reviewed

- [x] Slow-network/mobile-device testing completed

- [x] Security review completed

- [x] E2E tests pass

- [x] Production build passes

- [x] Sentry and analytics configured

- [x] No mock production data or debug logs remain

## Product Experience Goal

CUSTOMER  
"I have a problem"  
↓  
"Tell us what happened"  
↓  
"We found the right professional"  
↓  
"They're coming"  
↓  
"Work completed"  
  
WORKER  
"I'm available"  
↓  
"Nearby work"  
↓  
"I understand the job"  
↓  
"Accept"  
↓  
"Complete work"  
↓  
"See what I actually earned"

## Recommended Development Method

Give Codex one phase at a time. After every phase: review changes, run typecheck/lint/tests/build, manually test relevant mobile flows, commit, and only then move to the next phase.

Phase prompt  
↓  
Codex implements  
↓  
Review changes  
↓  
Typecheck + lint + tests + production build  
↓  
Manual mobile-flow test  
↓  
Commit  
↓  
Next phase
