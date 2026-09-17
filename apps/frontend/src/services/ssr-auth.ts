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

/**
 * Is a signed-in session behind this request?
 *
 * Answered from the request cookies alone, with NO backend round-trip, so it is
 * cheap enough to call in a page's frontmatter.
 *
 * The access token is valid for 15 minutes and the refresh token for 7 days, and
 * the refresh token is only ever written by a successful login (the backend
 * clears both on logout). So "a valid access token OR any refresh token" matches
 * a signed-in browser across the whole 7-day window, including the 15-minute
 * gaps where the access token has aged out. That gap is exactly the case a naive
 * access-token-only check would get wrong, painting the signed-out UI at a
 * signed-in visitor.
 */
export function hasSession(cookieHeader?: string): boolean {
  if (!cookieHeader) return false;
  if (!isExpired(readCookie(cookieHeader, 'authToken'))) return true;
  return Boolean(readCookie(cookieHeader, 'refreshToken'));
}

/**
 * Role of the session behind this request, or undefined when there is none.
 *
 * Runs through `ssrCookieHeader` first so an aged-out access token is refreshed
 * before we read it, then decodes the payload: the backend signs `role` into the
 * JWT (`auth/interfaces/jwt-payload.interface.ts`), so no extra call is needed.
 *
 * This is a rendering guard, not a security boundary — the API re-checks the
 * role on every `/admin` request. It exists so a non-admin never sees the panel.
 */
export async function getSessionRole(cookieHeader?: string): Promise<string | undefined> {
  const header = await ssrCookieHeader(cookieHeader);
  const token = header && readCookie(header, 'authToken');
  if (!token || isExpired(token)) return undefined;

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
    return typeof payload.role === 'string' ? payload.role : undefined;
  } catch {
    return undefined;
  }
}
