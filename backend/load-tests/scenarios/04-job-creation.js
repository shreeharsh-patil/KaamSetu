import http from 'k6/http';
import { check, sleep } from 'k6';
import { API_PREFIX, PROGRESSIVE_LOAD_STAGES, WRITE_THRESHOLDS } from '../config.js';
import { authenticateUser } from '../helpers/auth.js';
import { generateJobPayload } from '../helpers/data.js';

export const options = {
  stages: PROGRESSIVE_LOAD_STAGES,
  thresholds: WRITE_THRESHOLDS,
};

export function setup() {
  // Discover an active category and skill ID
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
  // Authenticate uniquely per virtual user
  const auth = authenticateUser(__VU);
  if (!auth) {
    sleep(1);
    return;
  }

  // 1. Create a Job Draft
  const payload = generateJobPayload(data.categoryId, [data.skillId]);
  const createRes = http.post(
    `${API_PREFIX}/jobs`,
    JSON.stringify(payload),
    auth.headers
  );

  const created = check(createRes, {
    'create job status is 201': (r) => r.status === 201,
    'job id returned': (r) => {
      if (r.status !== 201) return false;
      const body = JSON.parse(r.body);
      return body.data && body.data.id !== undefined;
    },
  });

  // 2. Publish the Job
  if (created && createRes.status === 201) {
    const job = JSON.parse(createRes.body).data;
    const publishRes = http.post(
      `${API_PREFIX}/jobs/${job.id}/publish`,
      null,
      auth.headers
    );

    check(publishRes, {
      'publish job status is 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
