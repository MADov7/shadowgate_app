import 'server-only';
import { NextResponse } from 'next/server';
import { HttpError, MissingSecretError } from './errors';
import { StripeApiError, StripeKeyError } from './stripe';
import { SupabaseError, SupabaseUnavailableError } from './supabase';

// Consistent JSON responses and error handling for every API route (status codes 200/201/400/401/404/409/500/503).
// Error bodies contain a safe message only — never a stack trace, connection string, secret or password hash.

export function json(data: unknown, status = 200, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, { status, ...init, headers: { 'Cache-Control': 'no-store', ...(init?.headers ?? {}) } });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new HttpError(400, 'The request body must be valid JSON.');
  }
}

function safeLog(error: unknown) {
  const e = error as Error;
  const message = String(e?.message ?? error)
    .replace(/\b(sk|rk)_(test|live)_[A-Za-z0-9]+/g, '[hidden key]')
    .replace(/\bwhsec_[A-Za-z0-9]+/g, '[hidden secret]')
    .replace(/\bsb_(secret|publishable)_[A-Za-z0-9_-]+/g, '[hidden key]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[hidden token]');
  console.error(`[api] ${e?.name ?? 'Error'}: ${message}`);
}

const UNAUTHORIZED = {
  missing: 'Please log in first.',
  invalid: 'Your session is not valid. Please log in again.',
  expired: 'Your session has expired. Please log in again.',
} as const;

/** 429 with Retry-After (sign-up / log-in throttling, or Supabase Auth's own rate limit). */
export function tooManyRequests(retryAfterSeconds = 60): NextResponse {
  return json({ error: 'Too many attempts. Please wait a minute and try again.', code: 'rate_limited' }, 429, {
    headers: { 'Retry-After': String(Math.max(1, Math.round(retryAfterSeconds))) },
  });
}

/** 401 with the session problem ("missing" | "invalid" | "expired") so the UI can show the right message. */
export function unauthorized(reason: keyof typeof UNAUTHORIZED): NextResponse {
  return json({ error: UNAUTHORIZED[reason], reason }, 401);
}

/**
 * Defence in depth for cookie-authenticated POSTs (the session cookie is already SameSite=Lax): when the browser
 * sends an Origin header it must be this site.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const hosts = new Set<string>();
  try {
    hosts.add(new URL(request.url).host);
  } catch {
    // ignore
  }
  for (const h of [request.headers.get('host'), request.headers.get('x-forwarded-host')]) if (h) hosts.add(h.split(',')[0].trim());
  return hosts.has(originHost);
}

/** Public origin for Stripe's success/cancel URLs: SITE_URL if set (https), otherwise the request's own origin. */
export function siteOrigin(request: Request): string {
  const configured = process.env.SITE_URL?.trim();
  if (configured) {
    try {
      const u = new URL(configured);
      if (u.protocol === 'https:' || u.hostname === 'localhost') return u.origin;
    } catch {
      // fall back to the request origin
    }
  }
  return new URL(request.url).origin;
}

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) return json({ error: error.message, ...(error.details ?? {}) }, error.status);
  if (error instanceof MissingSecretError || error instanceof StripeKeyError) {
    safeLog(error);
    const payments = error instanceof StripeKeyError || error.key.startsWith('STRIPE_');
    return json(
      payments
        ? { error: 'Online payment is not set up yet. Please try again later.', code: 'payments_unavailable' }
        : { error: 'The store server is not fully configured yet. Please try again later.' },
      503,
    );
  }
  if (error instanceof StripeApiError) {
    safeLog(error); // status + Stripe error type/code only — never the key or the request body
    return json({ error: 'The payment service is not available right now. Please try again in a moment.', code: 'payments_unavailable' }, 502);
  }
  if (error instanceof SupabaseUnavailableError || (error instanceof SupabaseError && (error.status === 0 || error.status >= 500))) {
    safeLog(error);
    return json({ error: 'The database is temporarily unavailable. Please try again.' }, 503);
  }
  if (error instanceof SupabaseError && (error.status === 401 || error.status === 403 || error.code === 'PGRST205' || error.code === '42P01')) {
    // Wrong/missing key or the tables were not created yet: a configuration problem, not the visitor's fault.
    safeLog(error);
    return json({ error: 'The store server is not fully configured yet. Please try again later.' }, 503);
  }
  if (error instanceof SupabaseError && (error.status === 429 || error.code === 'over_request_rate_limit')) {
    safeLog(error);
    return tooManyRequests(60);
  }
  if (error instanceof SupabaseError && error.code === '23503') {
    // orders.user_id → auth.users: the account behind a still-valid session cookie was deleted.
    return json({ error: 'Your session is not valid. Please log in again.', reason: 'invalid' }, 401);
  }
  if (error instanceof SupabaseError && error.status === 400 && /^(22|23)/.test(error.code)) {
    return json({ error: 'Some values are not valid.' }, 400);
  }
  safeLog(error);
  return json({ error: 'Something went wrong on our side. Please try again.' }, 500);
}
