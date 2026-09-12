# KaamSetu Production Deployment & Operations Guide

This document provides complete, production-ready operational runbooks for deploying, scaling, and maintaining the **KaamSetu** backend platform across cloud providers (AWS, GCP, Kubernetes, or container platforms like Render and Railway).

---

## 1. Architectural Process Model

KaamSetu enforces a strict **separation of concerns** between synchronous client-facing web traffic and asynchronous background computation:

```
                            Client Applications (Web & Mobile)
                                          │
                                  HTTPS / WSS (Port 443)
                                          ▼
                            ┌───────────────────────────┐
                            │    Cloudflare / ALB       │
                            │   SSL / DDoS / CDN Cache  │
                            └─────────────┬─────────────┘
                                          │
                   ┌──────────────────────┴──────────────────────┐
                   ▼                                             ▼
       ┌───────────────────────┐                     ┌───────────────────────┐
       │   Express API Pod 1   │                     │   Express API Pod N   │
       │ (Stateless HTTP/WSS)  │                     │ (Stateless HTTP/WSS)  │
       └───────────┬───────────┘                     └───────────┬───────────┘
                   │                                             │
      ┌────────────┼───────────────────────────┬─────────────────┘
      │            │                           │
      ▼            ▼                           ▼
┌───────────┐ ┌─────────────┐       ┌───────────────────────┐
│  MongoDB  │ │    Redis    │       │     Object Storage    │
│   Atlas   │ │ (Managed)   │       │     (AWS S3 / R2)     │
│  (M10+)   │ └──────┬──────┘       └───────────────────────┘
└───────────┘        │
                     │ BullMQ Queues (notifications, ai-audio-jobs, default)
                     ▼
       ┌───────────────────────────┐         ┌───────────────────────────┐
       │     BullMQ Worker 1       │   ...   │     BullMQ Worker M       │
       │ (Dedicated Background Pod)│         │ (Dedicated Background Pod)│
       └───────────────────────────┘         └───────────────────────────┘
```

### Critical Architecture Rules
1. **Never run background workers inside the web process**: Heavy audio processing, email/SMS provider dispatch, and async AI tasks consume significant event-loop cycles and heap memory. The `apps/api` container handles HTTP requests and Socket.IO events only. The `apps/worker` container runs as a dedicated headless process.
2. **Stateless API tier**: Any API replica can handle any user request. User sessions are verified via signed stateless JWTs with family-tracked refresh tokens persisted in MongoDB and cached in Redis.
3. **Direct-to-Storage Uploads**: Files never upload through the Express process. Clients request a cryptographically signed presigned PUT URL (`POST /api/v1/uploads/presign`) and upload directly to S3 or Cloudflare R2.

---

## 2. Containerization Architecture

KaamSetu uses a multi-stage Docker build with non-root execution and minimal runtime attack surfaces based on `node:22-alpine`.

### Key Container Characteristics
- **Base image**: `node:22-alpine` (hardened, minimal package surface).
- **Process supervisor**: `dumb-init` handles PID 1 signal forwarding (`SIGTERM`, `SIGINT`) and prevents zombie process accumulation.
- **Non-root user**: All runtime containers run as the built-in non-root user `node` (`uid=1000`, `gid=1000`).
- **Healthchecks**: Built-in container health probes periodically test `/health` via `wget`.
- **Pruned Dependencies**: Builder stage compiles TypeScript and runs `pnpm install --prod --ignore-scripts` to eliminate development dependencies across the monorepo for production runtime images.

### Local Development with Docker Compose

Run the entire cluster locally with a single command:

```bash
# Build and start all services (MongoDB, Redis, Express API, Background Worker)
docker compose up --build -d

# View status and health
docker compose ps

# Follow logs
docker compose logs -f api
docker compose logs -f worker

# Tear down cluster and preserve persistent volumes
docker compose down

# Tear down cluster and remove volumes
docker compose down -v
```

---

## 3. Express API Container Deployment

### Container Specifications
- **Recommended Resource Allocation**:
  - CPU: `1 vCPU` (minimum `0.5 vCPU`)
  - Memory: `1 GB - 2 GB RAM` (minimum `512 MB`)
- **Horizontal Pod Autoscaling (HPA)**:
  - Target CPU utilization: `70%`
  - Target Memory utilization: `80%`
  - Min replicas: `2` (for high availability across Availability Zones)
  - Max replicas: `10+` (based on peak traffic)

### Probes and Endpoints
| Probe | Path | Purpose | Success Code |
|---|---|---|---|
| **Liveness Probe** | `GET /health` | Validates process is alive and responding | `200 OK` |
| **Readiness Probe** | `GET /ready` | Validates MongoDB & Redis connectivity | `200 OK` (or `503 Service Unavailable`) |
| **Prometheus Metrics** | `GET /metrics` | Scraped by Prometheus / Datadog / Grafana Agent | `200 OK` |

### Cloud Deployment Examples

#### AWS ECS (Fargate) Task Definition
```json
{
  "family": "kaamsetu-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "kaamsetu-api",
      "image": "<aws_account_id>.dkr.ecr.ap-south-1.amazonaws.com/kaamsetu-api:latest",
      "essential": true,
      "portMappings": [
        { "containerPort": 5000, "protocol": "tcp" }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "wget -qO- http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 15
      },
      "secrets": [
        { "name": "MONGODB_URI", "valueFrom": "arn:aws:secretsmanager:...:secret:MONGODB_URI" },
        { "name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:...:secret:REDIS_URL" },
        { "name": "JWT_ACCESS_SECRET", "valueFrom": "arn:aws:secretsmanager:...:secret:JWT_ACCESS_SECRET" },
        { "name": "JWT_REFRESH_SECRET", "valueFrom": "arn:aws:secretsmanager:...:secret:JWT_REFRESH_SECRET" }
      ]
    }
  ]
}
```

---

## 4. BullMQ Background Worker Deployment

The background worker consumes jobs from Redis queues:
- `notifications`: SMS, Email, Push notifications, and In-App messages.
- `ai-audio-jobs`: Voice transcription, audio message translation, profile extraction.
- `default`: Background maintenance, cleanup, and audit rollups.

### Deployment Guidelines
- **No Inbound Public Traffic**: Workers do NOT expose public HTTP ports.
- **Internal Health Probe**: Workers expose an internal HTTP probe on `WORKER_HEALTH_PORT` (`5001`) responding to `GET /health` and `GET /ready` for internal container orchestrator health checks.
- **Autoscaling Metric**: Scale worker replicas based on **BullMQ Queue Depth** (e.g. when `notifications` queue latency or depth exceeds 500 jobs).
- **Concurrency**: Set default concurrency to `10` for I/O bound jobs (notifications) and `2-5` for compute/network heavy jobs (AI audio).

---

## 5. MongoDB Atlas Production Configuration

### 1. Cluster Tier & Topologies
- **Minimum Tier**: `M10` or higher (dedicated CPU/RAM, automated daily snapshots).
- **Replica Set**: Minimum 3-node replica set (`1 Primary, 2 Secondaries`) across multi-AZs.
- **WiredTiger Cache**: Sized automatically by Atlas based on RAM.

### 2. Connection String & Driver Settings
```
mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/kaamsetu?retryWrites=true&w=majority&maxPoolSize=50&minPoolSize=5&serverSelectionTimeoutMS=5000
```
- `retryWrites=true`: Automatically retries write operations on transient network glitches.
- `w=majority`: Ensures writes are acknowledged by a majority of replica nodes.
- `maxPoolSize=50`: Prevents connection pool exhaustion under high concurrent load.
- `minPoolSize=5`: Maintains hot standby connections.

### 3. Critical Indexes
KaamSetu requires geospatial and compound uniqueness indexes:
- `workerprofiles`:
  - `serviceLocation: "2dsphere"` (for nearby worker matching)
  - `skills.skillId: 1`
  - `availabilityStatus: 1, verificationStatus: 1`
- `jobs`:
  - `location: "2dsphere"`
  - `customerId: 1, createdAt: -1`
  - `status: 1, categoryId: 1, createdAt: -1`
  - `assignedWorkerId: 1, status: 1`
- `joboffers`:
  - `{ jobId: 1, workerId: 1 }` (unique compound index prevents duplicate offers)
  - `status: 1, expiresAt: 1`

Verify indexes with:
```bash
# Run index synchronization script
pnpm --filter @kaamsetu/api seed:indexes
```

---

## 6. Managed Redis Production Setup

### 1. Provider & Topology
- **Providers**: AWS ElastiCache (Redis engine), Redis Cloud, or Upstash.
- **Version**: Redis `7.x` or higher.
- **Multi-AZ Replication**: 1 Primary with at least 1 Read Replica and automatic failover.

### 2. Critical Configuration: Eviction Policy
> [!CAUTION]
> BullMQ relies on Redis hash, set, and stream structures. Never configure `allkeys-lru` on a Redis instance shared with BullMQ, or active background jobs will be evicted and permanently lost.
- **BullMQ Instance Policy**: `noeviction`
- If using a single shared Redis for both rate limiting and BullMQ: use `noeviction`. Expiring cache keys and rate limits have explicit TTLs and will clear automatically.

### 3. Persistence Configuration
- Enable AOF (`appendonly yes`) with `appendfsync everysec`.
- Enable automated daily RDB snapshots.

---

## 7. Object Storage (AWS S3 / Cloudflare R2)

### 1. Security Configuration
- **Block Public Access**: Enable `Block all public access` on the bucket.
- **Access Control**: Backend uses AWS IAM credentials (`S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`) with scoped permissions:
  - `s3:PutObject`
  - `s3:GetObject`
  - `s3:DeleteObject`

### 2. CORS Policy
Configure CORS on the bucket to allow authenticated client browsers/apps to directly upload images and documents:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "GET"],
    "AllowedOrigins": [
      "https://kaamsetu.com",
      "https://app.kaamsetu.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

---

## 8. Environment Variables Reference Matrix

| Variable | Type | Default | Production Requirement | Description |
|---|---|---|---|---|
| `NODE_ENV` | String | `development` | `production` | Enables production optimizations and strict mode |
| `PORT` | Number | `5000` | `5000` | Express HTTP listen port |
| `APP_VERSION` | String | `1.0.0` | SemVer tag | Current application release version |
| `API_PREFIX` | String | `/api/v1` | `/api/v1` | Global API route prefix |
| `MONGODB_URI` | String | - | **Required** | Production MongoDB Atlas SRV URI |
| `REDIS_URL` | String | - | **Required** | Production Redis connection string (`rediss://...` for TLS) |
| `JWT_ACCESS_SECRET` | String | - | **Required** | 32+ character high-entropy secret for access tokens |
| `JWT_REFRESH_SECRET` | String | - | **Required** | 32+ character high-entropy secret for refresh tokens |
| `CORS_ORIGINS` | String | `*` | **Required** | Comma-separated allowlist of production domains |
| `LOG_LEVEL` | String | `info` | `info` or `warn` | Pino logging level (`info` in production) |
| `STORAGE_PROVIDER` | Enum | `mock` | `s3` | Object storage provider (`s3` for AWS S3 or Cloudflare R2) |
| `S3_BUCKET` | String | `kaamsetu-uploads` | **Required** | Production S3 bucket name |
| `S3_REGION` | String | `ap-south-1` | Cloud Region | AWS or R2 storage region |
| `S3_ACCESS_KEY_ID` | String | - | **Required** | IAM Access Key |
| `S3_SECRET_ACCESS_KEY` | String | - | **Required** | IAM Secret Key |
| `CDN_BASE_URL` | String | - | Optional | CDN URL for serving public media (e.g. CloudFront) |
| `SENTRY_DSN` | String | - | Recommended | Sentry project DSN for error telemetry |
| `SENTRY_ENVIRONMENT` | String | `development` | `production` | Sentry environment tag |
| `METRICS_ENABLED` | Boolean | `true` | `true` | Enables `/metrics` Prometheus endpoint |
| `WORKER_HEALTH_PORT` | Number | `5001` | `5001` | Worker internal healthcheck port |

---

## 9. Database Migrations & Index Initialization

KaamSetu follows the **Expand and Contract** pattern for zero-downtime database changes:
1. **Expand**: Add new optional fields or indexes. Old application code continues functioning.
2. **Deploy**: Roll out new application version that writes to the new schema.
3. **Contract**: Remove deprecated fields or legacy indexes in a subsequent release.

### Pre-Deployment Verification
Before routing traffic to a new deployment, run the verification script:
```bash
# In CI/CD or deployment container step:
pnpm --filter @kaamsetu/api build
node -e "import('./apps/api/dist/database/mongodb.js').then(m => m.connectMongoDB({ uri: process.env.MONGODB_URI }).then(() => process.exit(0)).catch(() => process.exit(1)))"
```

---

## 10. Zero-Downtime Deployment & Rollback Playbook

### 1. Rolling Deployment Strategy
- **Step 1**: Run CI/CD pipeline (Lint, Typecheck, Automated Tests, Security Audit, Docker Build).
- **Step 2**: Apply non-breaking database schema and index updates to MongoDB Atlas.
- **Step 3**: Deploy new version of the **BullMQ Worker** service.
- **Step 4**: Deploy new version of the **Express API** service with rolling update (`minAvailable: 50%`, `maxSurge: 50%`).
- **Step 5**: Load balancer shifts traffic to new pods only after `GET /ready` returns `200 OK`.
- **Step 6**: Old pods receive `SIGTERM`, finish in-flight HTTP requests within 10 seconds, and gracefully exit.

### 2. Immediate Rollback Criteria
Trigger an automatic rollback if any of the following occur within 5 minutes of release:
- HTTP `5xx` error rate exceeds `1%` of total requests.
- Endpoint p95 latency exceeds `500ms`.
- MongoDB or Redis readiness probe fails (`/ready` returns `503`).
- Sentry alerts on new unhandled exceptions.

### 3. Rollback Procedure
```bash
# Roll back to the previous deployment revision
# Kubernetes:
kubectl rollout undo deployment/kaamsetu-api
kubectl rollout undo deployment/kaamsetu-worker

# AWS ECS:
aws ecs update-service --cluster production --service kaamsetu-api --task-definition kaamsetu-api:<previous_revision>

# Docker Compose (Local/Staging):
docker compose down
git checkout <previous_stable_commit>
docker compose up --build -d
```
