# KaamSetu Monorepo

Hyperlocal skilled-worker service platform connecting customers with verified local service professionals.

---

## 📁 Repository Structure

```
.
├── backend/                  # Production Backend Services & Packages
│   ├── apps/
│   │   ├── api/              # Express.js REST API + Socket.IO Realtime Gateway
│   │   └── worker/           # Dedicated BullMQ Background Worker Process
│   ├── packages/
│   │   ├── config/           # Environment validation & configuration
│   │   ├── logger/           # Structured Pino logging with data redaction
│   │   ├── types/            # Shared domain types & interfaces
│   │   └── validation/       # Zod schemas & input validators
│   ├── load-tests/           # k6 Progressive load test scenarios
│   ├── Dockerfile            # Multi-stage production Docker build
│   ├── Dockerfile.api        # API container build
│   ├── Dockerfile.worker     # Worker container build
│   ├── docker-compose.yml    # Backend local development stack
│   ├── DEPLOYMENT.md         # Production deployment runbook
│   ├── TESTING.md            # Testing guide & concurrency proofs
│   └── SECURITY.md           # Security hardening & audit documentation
│
├── frontend/                 # Next.js 16+ Progressive Web App (React 19)
│   ├── public/               # Static assets & PWA manifest
│   ├── src/                  # App router, components, hooks, and i18n
│   ├── FRONTEND_SECURITY.md  # Frontend security policies
│   └── RELEASE_CHECKLIST.md  # Release readiness checklist
│
├── .github/workflows/ci.yml  # GitHub Actions CI/CD Pipeline
└── docker-compose.yml        # Root development orchestrator
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.0.0
- pnpm >= 11.0.0
- MongoDB 7.0+
- Redis 7.0+

### 1. Backend

```bash
# From repository root
pnpm install
pnpm dev:backend

# Or navigate directly to backend
cd backend
pnpm install
pnpm dev
```

### 2. Frontend

```bash
# From repository root
npm run dev:frontend

# Or navigate directly to frontend
cd frontend
npm install
npm run dev
```

### 3. Docker Local Cluster

```bash
# Spin up MongoDB, Redis, API, and Background Worker
docker compose up --build -d
```

---

## 🧪 Testing

```bash
# Run backend tests (459 tests across 26 test suites)
pnpm test:backend

# Run frontend tests
pnpm test:frontend
```
