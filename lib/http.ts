import 'server-only';
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { HttpError, MissingSecretError } from './errors';

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
  const message = String(e?.message ?? error).replace(/mongodb(\+srv)?:\/\/[^\s]+/g, '[hidden URI]');
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

export function errorResponse(error: unknown): NextResponse {
  if (error instanceof HttpError) return json({ error: error.message, ...(error.details ?? {}) }, error.status);
  if (error instanceof MissingSecretError) {
    safeLog(error);
    return json({ error: 'The store server is not fully configured yet. Please try again later.' }, 503);
  }
  if (error instanceof mongoose.Error.ValidationError) return json({ error: 'Some values are not valid.' }, 400);
  if (isDatabaseUnavailable(error)) {
    safeLog(error);
    return json({ error: 'The database is temporarily unavailable. Please try again.' }, 503);
  }
  safeLog(error);
  return json({ error: 'Something went wrong on our side. Please try again.' }, 500);
}
