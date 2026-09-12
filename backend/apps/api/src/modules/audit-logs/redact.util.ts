const SENSITIVE_KEY_PATTERNS = [
  'password',
  'refreshtokenhash',
  'token',
  'secret',
  'refreshtoken',
  'accesstoken',
  'pin',
  'otp',
  'cvv',
  'creditcard',
  'cardnumber',
  'apikey',
  'privatekey',
  'authcode',
  'jwt_access_secret',
  'jwt_refresh_secret',
];

/**
 * Recursively redacts sensitive fields from objects or arrays
 * to ensure sensitive credentials/tokens never leak into audit records.
 */
export function redactSensitiveData<T = unknown>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== 'object') {
    return data;
  }

  // Handle Date, RegExp, ObjectId, Buffer, etc.
  if (
    data instanceof Date ||
    data instanceof RegExp ||
    typeof (data as { toHexString?: () => string }).toHexString === 'function'
  ) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => redactSensitiveData(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEY_PATTERNS.some((pattern) => lowerKey.includes(pattern));

    if (isSensitive) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
