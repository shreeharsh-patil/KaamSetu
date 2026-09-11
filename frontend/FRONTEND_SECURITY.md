# KaamSetu Frontend Security & Threat Model

This document outlines the frontend security policies, defensive patterns, and client-side threat mitigations implemented across the KaamSetu platform.

---

## 1. Authentication & Token Lifecycle
- **Refresh Token Isolation**: Refresh tokens are stored strictly in `HttpOnly`, `Secure`, `SameSite=Lax` cookies managed by the Express backend. They are never accessible to client JavaScript and are never written to `localStorage` or `sessionStorage`.
- **In-Memory Access Tokens**: Short-lived JWT access tokens are held exclusively in memory (`apiClient` closure) and rotated silently via `/api/v1/auth/refresh` on 401 interception.
- **Session Expiry**: When token refresh fails or upon logging out, all in-memory credentials are wiped and the user is redirected to `/login`.

---

## 2. Authorization Boundary Enforcement
- **Backend Authoritative**: Frontend route guards (e.g. `AuthGuard`, role-based redirects) serve purely as UI/UX conveniences. All authorization decisions, mutations, status changes, and data queries are validated on the Express backend against verified JWT claims.
- **State Machine Integrity**: Job status transitions (`ACCEPTED`, `EN_ROUTE`, `ARRIVED`, `IN_PROGRESS`, `COMPLETED`) cannot be arbitrarily manipulated via generic PATCH endpoints. Each stage requires explicit, dedicated action endpoints with cryptographic OTP verification where mandated.

---

## 3. Financial Integrity & Authoritative Totals
- **Zero Client-Side Financial Calculation**: The frontend never computes final payout, commission deductions, or escrow balances authoritatively.
- **Money Utility**: The `formatMoney()` utility only formats integer currency values supplied by the backend.

---

## 4. Privacy & Locality Masking
- **Pre-Assignment Protection**: Before a job offer is accepted by a worker, the customer's exact residential street address, flat number, and phone number are hidden. Workers only receive approximate locality and distance.
- **Post-Assignment Reveal**: Exact contact numbers and navigational links are unlocked only upon verified acceptance.

---

## 5. Cross-Site Scripting (XSS) & Content Security
- **No `dangerouslySetInnerHTML`**: All user-generated content (job titles, descriptions, chat messages, review notes) is rendered as plain text within React DOM nodes.
- **Image URL Sanitization**: User-uploaded photo previews use browser `blob:` Object URLs and are released from memory on unmount.
- **Open Redirect Guard**: Internal redirects validate that targets start with internal paths (`/customer`, `/worker`, `/admin`) and reject arbitrary external protocols.

---

## 6. Telemetry & PII Redaction
- Telemetry events recorded by `AnalyticsService` and `error-tracker` automatically redact phone numbers, tokens, passwords, and street addresses before transmitting.
