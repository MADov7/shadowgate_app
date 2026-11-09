import 'server-only';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE, SESSION_MAX_AGE, verifySession, type SessionCheck } from './session';

// Server-side session helpers for pages and API routes. The user id ALWAYS comes from the verified token,
// never from anything the browser sends in a body or query string.

/** Session of the current request (server components / route handlers). */
export async function getSession(): Promise<SessionCheck> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** Secure cookies whenever the request arrived over HTTPS (always on Netlify). */
export function isHttps(request: NextRequest): boolean {
  return request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https';
}

/** HttpOnly + SameSite=Lax session cookie; Secure over HTTPS. */
export function sessionCookie(token: string, secure: boolean) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

/** Expired cookie that removes the session in the browser. */
export function clearedSessionCookie(secure: boolean) {
  return { ...sessionCookie('', secure), maxAge: 0 };
}

/** The signed-in user's id + name from the verified token (for the navigation), or null. */
export async function getSessionUser(): Promise<{ id: string; name: string } | null> {
  const session = await getSession();
  return session.ok ? { id: session.userId, name: session.name } : null;
}

/**
 * Non-secret "signed in" marker readable by the browser (the session itself stays in the HttpOnly cookie). It only
 * lets the navigation skip GET /api/auth/me for anonymous visitors; the server never trusts it.
 */
export const HINT_COOKIE = 'sg_signed_in';

export function hintCookie(secure: boolean) {
  return { name: HINT_COOKIE, value: '1', httpOnly: false, sameSite: 'lax' as const, secure, path: '/', maxAge: 60 * 60 * 24 * 7 };
}

export function clearedHintCookie(secure: boolean) {
  return { ...hintCookie(secure), value: '', maxAge: 0 };
}
