# KaamSetu Frontend Release Checklist & Production Audit

This document serves as the sign-off checklist before deploying the KaamSetu Next.js frontend to staging and production environments.

---

## 1. Environment Configurations
- [x] `NEXT_PUBLIC_API_URL` points to production Express gateway (`/api/v1`)
- [x] No server secrets or private keys exposed in `NEXT_PUBLIC_*` variables
- [x] CORS and `SameSite=Lax` cookie configuration validated with backend
- [x] PWA webmanifest and service worker configured for standalone display

---

## 2. Code Quality & Build Verification
- [x] TypeScript Strict Mode: `npm run typecheck` (`tsc --noEmit`) passes with 0 errors
- [x] ESLint Strict Pass: `npm run lint` passes with 0 errors and 0 warnings
- [x] Production Bundle Build: `npm run build` compiles with zero Next.js route errors
- [x] Unused dependencies, temporary test flags, and mock bypasses removed

---

## 3. Responsive & Device Compatibility
- [x] **320px (iPhone SE / compact Android)**: All forms, buttons, cards wrap safely without horizontal viewport overflow.
- [x] **360px - 430px (Standard Mobile)**: Comfortable touch targets (`min-h-touch` >= 44px) across all interactive elements.
- [x] **768px - 1024px (Tablet / Desktop)**: Side navigation, grid expansion, and modal dialogs adapt seamlessly.

---

## 4. Accessibility & UX Resilience
- [x] Semantic HTML headings (`h1` through `h4`) with logical hierarchy
- [x] Visible focus rings (`focus-visible:ring-2`) for full keyboard navigation
- [x] Skip-to-content accessible anchor link
- [x] Clear loading skeletons, empty states, and localized error messages
- [x] Offline banner and `/offline` fallback page for network interruptions

---

## 5. Security & Data Privacy Sign-Off
- [x] Refresh tokens stored strictly in backend `HttpOnly` cookies
- [x] Zero `dangerouslySetInnerHTML` usage with user content
- [x] Worker view conceals customer's private address and phone until offer acceptance
- [x] Telemetry and error tracking automatically redact phone numbers and tokens

---

## 6. Deployment Sequence
1. Tag release commit on `Frontend` branch.
2. Trigger CI/CD pipeline running `typecheck`, `lint`, and `build`.
3. Verify production health check on `/` and `/login`.
4. Monitor initial customer job creations and worker match alerts.
