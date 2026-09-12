/**
 * KaamSetu k6 Load Testing Configuration
 * Defines progressive stages (500, 1000, 5000 concurrent users) and SLO thresholds.
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
export const API_PREFIX = `${BASE_URL}/api/v1`;

/**
 * Standard progressive stages for 500 -> 1000 -> 5000 concurrent users
 */
export const PROGRESSIVE_LOAD_STAGES = [
  // 1. Warm-up to 500 users
  { duration: '1m', target: 500 },
  { duration: '2m', target: 500 },

  // 2. Scale to 1,000 users
  { duration: '1m', target: 1000 },
  { duration: '3m', target: 1000 },

  // 3. Peak load scale to 5,000 users
  { duration: '2m', target: 5000 },
  { duration: '5m', target: 5000 },

  // 4. Cool-down ramp
  { duration: '1m', target: 0 },
];

/**
 * Quick smoke/load stages for local benchmarking
 */
export const QUICK_STAGES = [
  { duration: '30s', target: 100 },
  { duration: '1m', target: 500 },
  { duration: '30s', target: 0 },
];

/**
 * Enterprise production thresholds (SLOs)
 */
export const STANDARD_THRESHOLDS = {
  // 95% of requests must complete below 250ms
  http_req_duration: ['p(95)<250', 'p(99)<500'],
  // Error rate must remain below 1%
  http_req_failed: ['rate<0.01'],
};

export const READ_THRESHOLDS = {
  http_req_duration: ['p(95)<100', 'p(99)<250'],
  http_req_failed: ['rate<0.005'],
};

export const WRITE_THRESHOLDS = {
  http_req_duration: ['p(95)<300', 'p(99)<600'],
  http_req_failed: ['rate<0.02'],
};
