import 'server-only';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { HttpError, MissingSecretError } from './errors';
import { StripeApiError, StripeKeyError } from './stripe';

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
    .replace(/mongodb(\+srv)?:\/\/[^\s]+/g, '[hidden URI]')
    .replace(/\b(sk|rk)_(test|live)_[A-Za-z0-9]+/g, '[hidden key]')
    .replace(/\bwhsec_[A-Za-z0-9]+/g, '[hidden secret]');
  console.error(`[api] ${e?.name ?? 'Error'}: ${message}`);
}

// Driver/network errors that mean "MongoDB cannot be reached right now" (classified by name/code, not message text).
const DB_DOWN_NAMES = new Set([
  'MongooseServerSelectionError',
  'MongoServerSelectionError',
  'MongoNetworkError',
  'MongoNetworkTimeoutError',
  'MongoTopologyClosedError',
  'MongoNotConnectedError',
  'MongoServerClosedError',
]);
const DB_DOWN_CODES = new Set(['ENOTFOUND', 'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ETIMEOUT', 'EAI_AGAIN', 'ESERVFAIL']);

function isDatabaseUnavailable(error: unknown): boolean {
  const e = error as { name?: string; code?: string; cause?: unknown } | null;
  if (!e) return false;
  if (DB_DOWN_NAMES.has(e.name ?? '') || DB_DOWN_CODES.has(String(e.code ?? ''))) return true;
  return e.cause ? isDatabaseUnavailable(e.cause) : false;
}

const UNAUTHORIZED = {
  missing: 'Please log in first.',
  invalid: 'Your session is not valid. Please log in again.',
  expired: 'Your session has expired. Please log in again.',
} as const;

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
  if (error instanceof mongoose.Error.ValidationError) return json({ error: 'Some values are not valid.' }, 400);
  if (isDatabaseUnavailable(error)) {
    safeLog(error);
    return json({ error: 'The database is temporarily unavailable. Please try again.' }, 503);
  }
  safeLog(error);
  return json({ error: 'Something went wrong on our side. Please try again.' }, 500);
}
