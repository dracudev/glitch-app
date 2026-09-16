import { API_BASE_URL } from '@/services/api';

/**
 * Cookie header for server-side API fetches.
 *
 * The access-token cookie expires after 15 minutes while the refresh cookie lives
 * for 7 days, and the browser is the only thing that refreshes it. Without the
 * swap below, any SSR render after the access token ages out sees an anonymous
 * visitor and paints the signed-out state (not following, not liked) even though
 * the browser is still signed in.
 */

const EXPIRY_SKEW_MS = 30_000;

function readCookie(cookieHeader: string, name: string): string | undefined {
  return cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`))?.[1];
}

function isExpired(token: string | undefined): boolean {
  if (!token) return true;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return typeof payload.exp !== 'number' || payload.exp * 1000 < Date.now() + EXPIRY_SKEW_MS;
  } catch {
    return true;
  }
}

export async function ssrCookieHeader(cookieHeader?: string): Promise<string | undefined> {
  if (!cookieHeader) return undefined;

  const accessToken = readCookie(cookieHeader, 'authToken');
  if (!isExpired(accessToken)) return cookieHeader;

  const refreshToken = readCookie(cookieHeader, 'refreshToken');
  if (!refreshToken) return cookieHeader;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { cookie: cookieHeader },
    });
    if (!response.ok) return cookieHeader;

    const body = await response.json();
    const freshToken = body?.data?.accessToken;
    if (!freshToken) return cookieHeader;

    // ponytail: the refreshed cookie is not echoed back to the browser; the client
    // refreshes itself on the next call. Costs one backend round-trip while stale.
    return `authToken=${freshToken}; refreshToken=${refreshToken}`;
  } catch {
    return cookieHeader;
  }
}
