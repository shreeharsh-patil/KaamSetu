import http from 'k6/http';
import { check } from 'k6';
import { API_PREFIX } from '../config.js';

/**
 * Performs complete phone OTP authentication flow for a given virtual user ID.
 * Returns { user, accessToken, cookies }
 */
export function authenticateUser(vuId, role = 'CUSTOMER') {
  // Generate deterministic 10-digit phone: 9800000000 + vuId
  const phone = `98${String(vuId).padStart(8, '0')}`;
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
    'request-otp succeeded': (r) => r.status === 200,
  });

  // 2. In test/dev environment, the default OTP is 123456 or derived from dev provider
  // Using 123456 or 654321
  const otp = __ENV.DEV_OTP || '123456';

  // 3. Verify OTP
  const verifyRes = http.post(
    `${API_PREFIX}/auth/verify-otp`,
    JSON.stringify({
      phone,
      otp,
      deviceName: `k6-VU-${vuId}`,
    }),
    params
  );

  const verifySuccess = check(verifyRes, {
    'verify-otp succeeded': (r) => r.status === 200,
  });

  if (!verifySuccess) {
    return null;
  }

  const body = JSON.parse(verifyRes.body);
  return {
    user: body.data.user,
    accessToken: body.data.accessToken,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${body.data.accessToken}`,
    },
  };
}
