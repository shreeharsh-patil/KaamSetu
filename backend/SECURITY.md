# KaamSetu Security Architecture & Policy

This document outlines the security architecture, threat model, defense-in-depth controls, and vulnerability reporting procedures for the KaamSetu backend platform.

---

## 1. Security Philosophy & Assumptions

KaamSetu is designed under a **Zero-Trust** model. We assume:
- All incoming network traffic from clients is untrusted and potentially hostile.
- The platform operates behind reverse proxies, CDNs, or load balancers (`trust proxy: 1`).
- Clients cannot be trusted to enforce permissions, compute prices, or format object storage keys.
- Defense-in-depth: every layer (HTTP transport, API gateways, middlewares, service domain methods, database queries, and object storage) independently enforces validation and authorization boundaries.

---

## 2. Threat Model & Mitigation Matrix

| Threat Category | Potential Attack Vectors | KaamSetu Countermeasure |
| :--- | :--- | :--- |
| **Authentication Abuse** | Credential stuffing, OTP brute-force, SMS flooding | Max 3 OTP attempts, 60s resend cooldown, IP & phone rate limiting, SHA-256 hashed OTPs in Redis |
| **Session Hijacking** | Refresh token theft, token replay | Short-lived access tokens (15m), rotating refresh tokens (hashed in DB), **automatic token family revocation** on reuse detection |
| **Horizontal Privilege Escalation (IDOR)** | User A accessing User B's jobs, expenses, chats, documents | Strict ownership verification in domain services; query filters scoped to authenticated `userId` |
| **Vertical Privilege Escalation** | WORKER/CUSTOMER calling admin APIs, SUPPORT tampering with ledger | Granular RBAC (`requireRole`), strict role boundaries (`assertAdmin` vs `assertAdminOrSupport`), self-role elevation blocked |
| **NoSQL Injection** | `{"$gt": ""}`, `{"$ne": null}`, `{"$where": "..."}` in JSON/query | `nosqlSanitizerMiddleware` recursively blocks any key starting with `$` or containing `.` across body, query, and params |
| **HTTP Parameter Pollution (HPP)** | `?status=OPEN&status=DRAFT` array injection | `hppMiddleware` coerces un-whitelisted array query parameters to safe scalars |
| **DoS / Slowloris / Runaway Calls** | Payload stuffing, slow requests, endpoint flooding | Body size limit (`1mb` $\to$ 413), `requestTimeoutMiddleware` (30s $\to$ 408), distributed Redis rate limiting (429) |
| **Malicious File Uploads** | Web shells, path traversal (`../../etc/passwd`), spoofed MIME | Server-generated random UUID storage keys, direct signed upload to S3/R2, strict extension & MIME allowlists, storage verification |
| **Information Leakage** | Database stack traces, sensitive PII in logs | Centralized `errorHandlerMiddleware` sanitizing production errors, Pino logger redacting passwords, tokens, OTPs, Aadhaar, PAN |

---

## 3. Authentication & Session Security

### 3.1 Token Strategy
- **Access Tokens**: Short-lived JWTs (15 minutes). Signed with `HS256` using `JWT_ACCESS_SECRET` ($\ge$ 32 characters). Contains `userId`, `role`, `sessionId`, and `familyId`.
- **Refresh Tokens**: Long-lived JWTs (7 days). Stored in the database solely as a **SHA-256 cryptographic hash**. Transmitted in `HttpOnly`, `Secure`, `SameSite=Lax` cookies scoped strictly to `/api/v1/auth`.

### 3.2 Refresh Token Rotation & Family Revocation
1. On each refresh request, a new access token and a new refresh token are generated.
2. The old refresh token's hash is updated to the new token's hash.
3. If an attacker replays a previously used refresh token, the hash will not match the current session state. The system immediately flags a **Token Reuse Attack** and revokes all active sessions sharing that `familyId`.

### 3.3 OTP Security
- Generated using `crypto.randomInt(100000, 1000000)`.
- Stored as a SHA-256 hash with a 5-minute TTL in Redis (or in-memory fallback).
- Plaintext OTP is never logged, never returned in API responses, and never stored long-term.
- Hard limits: maximum 3 failed verification attempts before invalidation; minimum 60-second cooldown between resend requests.

---

## 4. Authorization & Access Control (RBAC)

### 4.1 System Roles
- `CUSTOMER`: Can create, manage, and review their own jobs; view matching workers; communicate with assigned workers.
- `WORKER`: Can manage skills, service radius, and availability; receive and respond to job offers; log expenses and view earnings ledger.
- `SUPPORT`: Read-only access to users, workers, jobs, reports, disputes, and audit logs. Strictly blocked from mutating state, suspending accounts, or adjusting ledger balances.
- `ADMIN`: Full operational authority: user suspension/restoration, worker verification approvals/rejections, financial adjustments, taxonomy management, and immutable audit logs.

### 4.2 Horizontal Isolation
- All query operations filter by `customerId` or `workerId` when invoked by non-admin actors.
- Mutating endpoints (`PATCH /jobs/:id`, `DELETE /expenses/:id`, `GET /uploads/:id/download-url`) explicitly assert ownership at both controller and service layers.

---

## 5. Input Validation & Injection Defenses

### 5.1 Schema Enforcement
- Every endpoint validates incoming input using **Zod** schemas (`@kaamsetu/validation`). Unknown or mismatched fields are rejected with structured `422 VALIDATION_ERROR` responses.

### 5.2 NoSQL Operator Sanitization
- `nosqlSanitizerMiddleware` runs before routing. Any request body, query string, or route parameter containing keys matching `/^\$|\./` is rejected immediately with `400 Bad Request`.

### 5.3 HTTP Parameter Pollution (HPP)
- `hppMiddleware` normalizes queries containing repeated keys (e.g., `?category=A&category=B`) to the scalar value `B`, unless explicitly whitelisted (e.g., `skills`).

---

## 6. Rate Limiting & Distributed Abuse Prevention

### 6.1 Redis-Backed Distributed Token Buckets
Rate limiting is backed by Redis using an atomic Lua script (`INCR` + `PEXPIRE` + `PTTL`), falling back gracefully to an in-memory bucket store when Redis is unavailable:
- **Global Rate Limiter**: 300 requests per minute per IP across `/api/v1/*` (skips `/health` and `/ready`).
- **Auth Rate Limiter**: 15 requests per minute per IP/phone on `/request-otp`, `/verify-otp`, and `/refresh`.
- **Upload Rate Limiter**: 20 requests per minute per user on `/uploads/presign`.

### 6.2 Standard Rate Limit Headers
All responses include:
- `RateLimit-Limit`: Maximum requests permitted in window.
- `RateLimit-Remaining`: Number of requests remaining in current window.
- `RateLimit-Reset`: Unix timestamp when window resets.
- `Retry-After`: Seconds until retry is permitted (sent on 429).

---

## 7. Network & Transport Security

### 7.1 Security Headers (Helmet)
- `Content-Security-Policy`: Restricts scripts, styles, fonts, and images to `'self'` and trusted origins; denies `object-src` and `frame-ancestors`.
- `X-Frame-Options: DENY`: Protects against clickjacking.
- `X-Content-Type-Options: nosniff`: Prevents MIME-type sniffing.
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains; preload` (1 year).
- `Referrer-Policy: strict-origin-when-cross-origin`.
- `Permissions-Policy`: Blocks camera, microphone, USB, and restrict geolocation to `self`.

### 7.2 Strict CORS Allowlist
- Configured via `CORS_ORIGINS`.
- Requests from unauthorized origins are rejected with `403 Forbidden` (`code: 'FORBIDDEN'`).
- Preflight `OPTIONS` requests are cached for 24 hours (`maxAge: 86400`).

### 7.3 Request Timeout
- `requestTimeoutMiddleware` imposes a default 30-second execution cap (`REQUEST_TIMEOUT_MS`). Requests exceeding this limit terminate with `408 REQUEST_TIMEOUT`.

---

## 8. Secure Object Storage (Phase 10)

- **Signed Uploads**: Large binary files never flow through Express API nodes. Clients request a presigned `PUT` URL and upload directly to S3 / Cloudflare R2.
- **Unpredictable Object Keys**: Object keys follow `uploads/<purpose>/<userId>/<timestamp>-<uuid>.<ext>`. User-submitted filenames are never used as storage keys, neutralizing path traversal attacks.
- **Strict Privacy**: Verification documents (`VERIFICATION_DOCUMENT`) and receipts (`EXPENSE_RECEIPT`) are stored with `isPublic: false` and `publicUrl: null`. Download access requires a temporary presigned URL (5-minute expiry) authorized only for the owner or `ADMIN`/`SUPPORT`.

---

## 9. Logging & Data Protection

- **Sensitive Key Redaction**: Pino logger redacts `password`, `token`, `refreshToken`, `accessToken`, `authorization`, `cookie`, `secret`, `apiKey`, `otp`, `pin`, `aadhaar`, `pan`, `ssn`, `bankAccount`, and private keys.
- **Financial Integrity**: All monetary values are represented as positive integers in **paise** (1 INR = 100 paise) to prevent floating-point rounding vulnerabilities.
- **Immutable Audit Trail**: Administrative and financial mutations produce append-only audit records tracking `actorId`, `actorRole`, `action`, `resourceType`, `resourceId`, `before`, `after`, and `ipAddress`.

---

## 10. Vulnerability Reporting & Disclosure

If you discover a security vulnerability within KaamSetu:
1. **Do not open a public GitHub issue.**
2. Send an advisory email to `security@kaamsetu.in` with:
   - Detailed description of the vulnerability.
   - Steps to reproduce or proof-of-concept (PoC).
   - Potential impact and affected endpoints.
3. The security team will acknowledge receipt within 24 hours and provide an estimated remediation timeline.
