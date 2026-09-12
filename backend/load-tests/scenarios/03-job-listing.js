import http from 'k6/http';
import { check, sleep } from 'k6';
import { API_PREFIX, PROGRESSIVE_LOAD_STAGES, READ_THRESHOLDS } from '../config.js';
import { authenticateUser } from '../helpers/auth.js';

export const options = {
  stages: PROGRESSIVE_LOAD_STAGES,
  thresholds: READ_THRESHOLDS,
};

export function setup() {
  // Setup a test authenticated user
  const auth = authenticateUser(99999);
  return { token: auth ? auth.accessToken : null };
}

export default function (data) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      ...(data.token ? { Authorization: `Bearer ${data.token}` } : {}),
    },
  };

  // 1. List Open Jobs (Default)
  const resOpen = http.get(`${API_PREFIX}/jobs?status=OPEN&limit=20`, params);
  check(resOpen, {
    'list jobs status is 200': (r) => r.status === 200,
    'returns pagination metadata': (r) => {
      if (r.status !== 200) return false;
      const body = JSON.parse(r.body);
      return body.data && body.data.pagination !== undefined;
    },
  });

  // 2. Paginate using cursor if returned
  if (resOpen.status === 200) {
    const body = JSON.parse(resOpen.body);
    const cursor = body.data?.pagination?.nextCursor;
    if (cursor) {
      const resPage2 = http.get(
        `${API_PREFIX}/jobs?status=OPEN&limit=10&cursor=${cursor}`,
        params
      );
      check(resPage2, {
        'cursor pagination status is 200': (r) => r.status === 200,
      });
    }
  }

  // 3. Service Categories Listing
  const catRes = http.get(`${API_PREFIX}/categories`, params);
  check(catRes, {
    'categories status is 200': (r) => r.status === 200,
  });

  sleep(0.5);
}
