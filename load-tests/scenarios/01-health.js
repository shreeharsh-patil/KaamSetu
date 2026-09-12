import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE_URL, PROGRESSIVE_LOAD_STAGES, READ_THRESHOLDS } from '../config.js';

export const options = {
  stages: PROGRESSIVE_LOAD_STAGES,
  thresholds: READ_THRESHOLDS,
};

export default function () {
  // 1. Check /health endpoint
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health status is 200': (r) => r.status === 200,
    'health returns UP': (r) => JSON.parse(r.body).status === 'UP',
  });

  // 2. Check /ready endpoint
  const readyRes = http.get(`${BASE_URL}/ready`);
  check(readyRes, {
    'ready status is 200 or 503': (r) => r.status === 200 || r.status === 503,
  });

  sleep(0.5);
}
