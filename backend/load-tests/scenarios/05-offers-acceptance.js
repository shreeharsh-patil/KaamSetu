import http from 'k6/http';
import { check, sleep } from 'k6';
import { API_PREFIX, PROGRESSIVE_LOAD_STAGES, WRITE_THRESHOLDS } from '../config.js';
import { authenticateUser } from '../helpers/auth.js';

export const options = {
  stages: PROGRESSIVE_LOAD_STAGES,
  thresholds: {
    ...WRITE_THRESHOLDS,
    // Expected 409 conflicts on contested offers do not count as infrastructure failures
    http_req_failed: ['rate<0.05'],
  },
};

export default function () {
  // Worker authentication per VU
  const auth = authenticateUser(__VU + 50000, 'WORKER');
  if (!auth) {
    sleep(1);
    return;
  }

  // 1. Fetch pending offers for this worker
  const offersRes = http.get(`${API_PREFIX}/worker/offers?status=PENDING`, auth.headers);
  check(offersRes, {
    'get offers status is 200': (r) => r.status === 200,
  });

  if (offersRes.status === 200) {
    const body = JSON.parse(offersRes.body);
    const offers = body.data?.offers || body.data || [];

    if (offers.length > 0) {
      const targetOffer = offers[0];

      // 2. Concurrently attempt to accept offer
      const acceptRes = http.post(
        `${API_PREFIX}/offers/${targetOffer.id}/accept`,
        null,
        auth.headers
      );

      // Either 200 (won the job) or 409 (another worker accepted first) are valid business outcomes
      check(acceptRes, {
        'accept returns 200 or 409 conflict': (r) => r.status === 200 || r.status === 409,
      });
    }
  }

  sleep(0.5);
}
