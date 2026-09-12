# KaamSetu k6 Load Testing Suite

Comprehensive performance, concurrency, and load testing suite designed to benchmark the KaamSetu backend across **500**, **1,000**, and **5,000** concurrent virtual users (VUs).

---

## 1. Prerequisites & Installation

### Windows (Winget / Chocolatey / Scoop)
```powershell
# Using Winget
winget install k6 --source winget

# Or using Chocolatey
choco install k6

# Or using Scoop
scoop install k6
```

### macOS (Homebrew)
```bash
brew install k6
```

### Linux (Debian / Ubuntu)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Docker
```bash
docker run --rm -i --network="host" grafana/k6 run - <load-tests/scenarios/01-health.js
```

---

## 2. Progressive Load Test Scenarios

| Scenario Script | Target Endpoints | Traffic Pattern | Primary SLA Thresholds |
| :--- | :--- | :--- | :--- |
| [`01-health.js`](./scenarios/01-health.js) | `/health`, `/ready` | 500 $\to$ 1k $\to$ 5k VUs | p(95) < 100ms, Error < 0.5% |
| [`02-auth-flow.js`](./scenarios/02-auth-flow.js) | `/auth/request-otp`, `/verify-otp`, `/refresh` | 500 $\to$ 1k $\to$ 5k VUs | p(95) < 300ms, Error < 2% |
| [`03-job-listing.js`](./scenarios/03-job-listing.js) | `GET /jobs`, `/categories` | 500 $\to$ 1k $\to$ 5k VUs | p(95) < 100ms, Error < 0.5% |
| [`04-job-creation.js`](./scenarios/04-job-creation.js) | `POST /jobs`, `POST /jobs/:id/publish` | 500 $\to$ 1k $\to$ 5k VUs | p(95) < 300ms, Error < 2% |
| [`05-offers-acceptance.js`](./scenarios/05-offers-acceptance.js) | `GET /worker/offers`, `POST /offers/:id/accept` | 500 $\to$ 1k $\to$ 5k VUs | p(95) < 250ms, Conflict rate normal |
| [`06-full-marketplace-lifecycle.js`](./scenarios/06-full-marketplace-lifecycle.js) | End-to-end user & worker lifecycle | 500 $\to$ 1k $\to$ 5k VUs | p(95) < 250ms, Error < 1% |

---

## 3. Running Load Tests

### 1. Run Baseline Health Check
```powershell
k6 run load-tests/scenarios/01-health.js
```

### 2. Run Progressive Authentication Benchmark
```powershell
k6 run load-tests/scenarios/02-auth-flow.js
```

### 3. Run Job Read & Search Load Test
```powershell
k6 run load-tests/scenarios/03-job-listing.js
```

### 4. Run Job Write & Publishing Load Test
```powershell
k6 run load-tests/scenarios/04-job-creation.js
```

### 5. Run Concurrency Offer Acceptance Test
```powershell
k6 run load-tests/scenarios/05-offers-acceptance.js
```

### 6. Run Full 5,000-User Progressive Simulation
```powershell
k6 run load-tests/scenarios/06-full-marketplace-lifecycle.js
```

### Passing Custom Environment Variables
```powershell
# Point to staging / production deployment
k6 run -e BASE_URL=https://api.staging.kaamsetu.in load-tests/scenarios/06-full-marketplace-lifecycle.js
```

---

## 4. Production SLO Thresholds

- **p(95) Response Latency**: $\le$ 250ms under peak 5,000 concurrent VUs.
- **p(99) Response Latency**: $\le$ 500ms under peak load.
- **HTTP Error Rate**: $\le$ 1.0% (excluding expected 409 conflicts on contested job offers).
- **Concurrency Invariant**: Under 50+ concurrent requests on a single job offer, exactly 1 succeeds (HTTP 200) and all remaining receive HTTP 409 Conflict. Zero duplicate assignments.
