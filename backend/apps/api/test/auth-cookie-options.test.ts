import { describe, expect, it } from 'vitest';
import {
  getRefreshCookieClearOptions,
  getRefreshCookieOptions,
} from '../src/modules/auth/auth-cookie-options.js';

describe('refresh cookie options', () => {
  it('permits the production web app to send the refresh cookie to a separately hosted API', () => {
    const options = getRefreshCookieOptions(true);

    expect(options).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth',
    });
    expect(getRefreshCookieClearOptions(true)).toMatchObject({
      secure: true,
      sameSite: 'none',
      path: '/api/v1/auth',
    });
  });

  it('retains same-site cookies for local and test environments', () => {
    expect(getRefreshCookieOptions(false)).toMatchObject({
      secure: false,
      sameSite: 'lax',
    });
  });
});
