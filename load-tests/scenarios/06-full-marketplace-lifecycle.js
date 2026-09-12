import http from 'k6/http';
import { check, sleep } from 'k6';
import { API_PREFIX, PROGRESSIVE_LOAD_STAGES, STANDARD_THRESHOLDS } from '../config.js';
import { authenticateUser } from '../helpers/auth.js';
import { generateJobPayload } from '../helpers/data.js';

export const options = {
  stages: PROGRESSIVE_LOAD_STAGES,
  thresholds: STANDARD_THRESHOLDS,
};

export function setup() {
  const catRes = http.get(`${API_PREFIX}/categories`);
  let categoryId = '660000000000000000000001';
  let skillId = '660000000000000000000002';

  if (catRes.status === 200) {
    const body = JSON.parse(catRes.body);
    if (body.data && body.data.length > 0) {
      categoryId = body.data[0].id;
      if (body.data[0].skills && body.data[0].skills.length > 0) {
        skillId = body.data[0].skills[0].id;
      }
    }
  }

  return { categoryId, skillId };
}

export default function (data) {
  const vu = __VU;

  // Split virtual users: 50% Customers, 50% Workers
  const isCustomer = vu % 2 === 0;

  if (isCustomer) {
    // ---------------- CUSTOMER USER JOURNEY ----------------
    const custAuth = authenticateUser(vu, 'CUSTOMER');
    if (!custAuth) return;

    // 1. Create and Publish Job
    const payload = generateJobPayload(data.categoryId, [data.skillId]);
    const jobRes = http.post(`${API_PREFIX}/jobs`, JSON.stringify(payload), custAuth.headers);

    if (jobRes.status === 201) {
      const job = JSON.parse(jobRes.body).data;
      http.post(`${API_PREFIX}/jobs/${job.id}/publish`, null, custAuth.headers);

      // 2. Poll job status
      http.get(`${API_PREFIX}/jobs/${job.id}`, custAuth.headers);
    }
  } else {
    // ---------------- WORKER USER JOURNEY ----------------
    const workerAuth = authenticateUser(vu + 100000, 'WORKER');
    if (!workerAuth) return;

    // 1. Browse Open Jobs
    http.get(`${API_PREFIX}/jobs?status=OPEN&limit=10`, workerAuth.headers);

    // 2. Check Pending Offers
    const offersRes = http.get(`${API_PREFIX}/worker/offers?status=PENDING`, workerAuth.headers);
    if (offersRes.status === 200) {
      const offers = JSON.parse(offersRes.body).data?.offers || [];
      if (offers.length > 0) {
        http.post(`${API_PREFIX}/offers/${offers[0].id}/accept`, null, workerAuth.headers);
      }
    }

    // 3. View Worker Earnings Summary
    http.get(`${API_PREFIX}/earnings/summary`, workerAuth.headers);
  }

  sleep(1);
}
