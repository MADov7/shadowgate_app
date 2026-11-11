// Login session token (JWT). Issued only after Supabase Auth has accepted the email + password (lib/supabase.ts →
// signInWithPassword); its subject is the Supabase Auth user id. Signed with JWT_SECRET (server environment only),
// sent to the browser only inside an HttpOnly cookie, and verified on the server for every protected page and API route.
import jwt from 'jsonwebtoken';
import { MissingSecretError } from './errors';
import { isUuid } from './supabaseCore';

export const SESSION_COOKIE = 'sg_session';
/** Session lifetime: 7 days (cookie Max-Age and JWT expiry match). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionCheck =
  | { ok: true; userId: string; name: string }
  | { ok: false; reason: 'missing' | 'invalid' | 'expired' };

function secret(): string {
  const value = process.env.JWT_SECRET;
  if (!value) throw new MissingSecretError('JWT_SECRET');
  return value;
}

/** Creates an expiring token for a user. `expiresIn` (seconds) is only overridden by tests. */
export function signSession(user: { id: string; name: string }, expiresIn: number = SESSION_MAX_AGE): string {
  return jwt.sign({ name: user.name }, secret(), { subject: user.id, expiresIn, algorithm: 'HS256' });
}

/** Checks a token: missing, invalid (bad signature / malformed / wrong algorithm) or expired. */
export function verifySession(token: string | null | undefined): SessionCheck {
  if (!token) return { ok: false, reason: 'missing' };
  try {
    const payload = jwt.verify(token, secret(), { algorithms: ['HS256'] });
    // The subject is the Supabase Auth user id (a UUID).
    if (typeof payload === 'string' || !isUuid(payload.sub)) {
      return { ok: false, reason: 'invalid' };
    }
    return { ok: true, userId: payload.sub, name: typeof payload.name === 'string' ? payload.name : '' };
  } catch (error) {
    if (error instanceof MissingSecretError) throw error;
    if (error instanceof jwt.TokenExpiredError) return { ok: false, reason: 'expired' };
    return { ok: false, reason: 'invalid' };
  }
}
