import { API_BASE_URL } from '@/services/api';

/** Cookie header for SSR API fetches; swaps in a refreshed access token when the original has aged out. */

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

    // The refreshed cookie isn't echoed back; the client refreshes itself on the next call.
    return `authToken=${freshToken}; refreshToken=${refreshToken}`;
  } catch {
    return cookieHeader;
  }
}

/** Is a signed-in session behind this request? Answered from cookies alone, with no backend round-trip. */
export function hasSession(cookieHeader?: string): boolean {
  if (!cookieHeader) return false;
  if (!isExpired(readCookie(cookieHeader, 'authToken'))) return true;
  return Boolean(readCookie(cookieHeader, 'refreshToken'));
}

/** Role of the session behind this request, or undefined. A rendering guard only — the API re-checks the role. */
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
