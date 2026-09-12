import type { CookieOptions } from 'express';

/**
 * Refresh tokens are stored on the API domain. In production the web app is
 * hosted on a different site, so browser credentialed fetches require a
 * cross-site cookie. `SameSite=None` must always be paired with `Secure`.
 */
export function getRefreshCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function getRefreshCookieClearOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/auth',
  };
}
