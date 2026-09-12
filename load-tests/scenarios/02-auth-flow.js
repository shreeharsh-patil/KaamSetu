import http from 'k6/http';
import { check, sleep } from 'k6';
import { API_PREFIX, PROGRESSIVE_LOAD_STAGES, WRITE_THRESHOLDS } from '../config.js';

export const options = {
  stages: PROGRESSIVE_LOAD_STAGES,
  thresholds: WRITE_THRESHOLDS,
};

export default function () {
  const vuId = __VU;
  const iter = __ITER;
  // Deterministic 10-digit number per VU and iteration
  const phone = `98${String((vuId * 1000 + iter) % 100000000).padStart(8, '0')}`;
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // 1. Request OTP
  const reqRes = http.post(
    `${API_PREFIX}/auth/request-otp`,
    JSON.stringify({ phone }),
    params
  );

  check(reqRes, {
    'request-otp status is 200 or 429': (r) => r.status === 200 || r.status === 429,
  });

  // 2. Verify OTP (if not rate-limited)
  if (reqRes.status === 200) {
    const verifyRes = http.post(
      `${API_PREFIX}/auth/verify-otp`,
      JSON.stringify({
        phone,
        otp: __ENV.DEV_OTP || '123456',
        deviceName: 'k6-load-runner',
      }),
      params
    );

    const verified = check(verifyRes, {
      'verify-otp status is 200': (r) => r.status === 200,
      'access token received': (r) => {
        if (r.status !== 200) return false;
        const body = JSON.parse(r.body);
        return body.data && body.data.accessToken !== undefined;
      },
    });

    // 3. Token Refresh Rotation
    if (verified && verifyRes.status === 200) {
      const refreshRes = http.post(`${API_PREFIX}/auth/refresh`, null, params);
      check(refreshRes, {
        'refresh status is 200': (r) => r.status === 200,
      });
    }
  }

  sleep(1);
}
