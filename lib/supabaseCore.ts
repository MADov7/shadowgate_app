// Pure Supabase helpers (no network) — unit-tested in lib/supabaseCore.test.ts.
// Shadow Gate talks to Supabase's REST APIs directly with fetch (lib/supabase.ts): PostgREST for the `products`
// and `orders` tables and Supabase Auth (GoTrue) for sign-up / log-in. These helpers clean up the configured
// values and build the request headers the way the official supabase-js client does.

/** Strips what hosting dashboards sometimes keep around a pasted value: quotes, spaces, line breaks, "NAME=". */
export function cleanEnvValue(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  let v = raw.trim();
  const eq = /^[A-Z][A-Z0-9_]*=(.*)$/s.exec(v);
  if (eq) v = eq[1].trim();
  v = v.replace(/^["']|["']$/g, '').trim();
  return v || undefined;
}

/** Project URL: https://<ref>.supabase.co (or a local http://localhost:54321 stack). Returns the origin, or null. */
export function normalizeSupabaseUrl(raw: string | undefined | null): string | null {
  const v = cleanEnvValue(raw);
  if (!v) return null;
  try {
    const u = new URL(v);
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (u.protocol !== 'https:' && !(local && u.protocol === 'http:')) return null;
    if (!local && !/^[a-z0-9-]+\.supabase\.(co|in|net)$/i.test(u.hostname)) return null;
    return u.origin;
  } catch {
    return null;
  }
}

export type KeyKind = 'publishable' | 'secret' | 'anon' | 'service_role' | 'unknown';

function base64UrlJson(part: string): Record<string, unknown> | null {
  try {
    const json = Buffer.from(part.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const value = JSON.parse(json) as unknown;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/**
 * Which kind of Supabase API key this is. New keys: sb_publishable_… / sb_secret_…; legacy keys are JWTs whose
 * `role` claim is "anon" or "service_role" (only the payload is read here — Supabase itself verifies the key).
 */
export function supabaseKeyKind(key: string | undefined | null): KeyKind {
  if (!key) return 'unknown';
  if (/^sb_publishable_[A-Za-z0-9_-]{10,}$/.test(key)) return 'publishable';
  if (/^sb_secret_[A-Za-z0-9_-]{10,}$/.test(key)) return 'secret';
  const parts = key.split('.');
  if (parts.length === 3 && parts.every((p) => /^[A-Za-z0-9_-]+$/.test(p))) {
    const role = base64UrlJson(parts[1])?.role;
    if (role === 'anon') return 'anon';
    if (role === 'service_role') return 'service_role';
  }
  return 'unknown';
}

export const isPublicKey = (kind: KeyKind) => kind === 'publishable' || kind === 'anon';
export const isServerKey = (kind: KeyKind) => kind === 'secret' || kind === 'service_role';

/**
 * Request headers for a Supabase API key. Legacy JWT keys go in both `apikey` and `Authorization: Bearer`;
 * the new sb_… keys are not JWTs, so they go in `apikey` only (Supabase's gateway turns them into a JWT).
 */
export function supabaseHeaders(key: string): Record<string, string> {
  return key.startsWith('sb_') ? { apikey: key } : { apikey: key, Authorization: `Bearer ${key}` };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Supabase Auth user ids and order ids are UUIDs. Anything else is rejected before it reaches a query. */
export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}

/**
 * PostgREST error body: { code, message, details, hint }. A unique-constraint violation is code 23505 (HTTP 409).
 * HTTP 409 alone is not enough: a foreign-key violation (23503) is also a 409.
 */
export function isUniqueViolation(_status: number, body: unknown): boolean {
  return (body as { code?: unknown } | null)?.code === '23505';
}

/** Supabase Auth error code from either error shape ({ error_code } on new servers, { code: "…" } / { error } on older). */
export function authErrorCode(body: unknown): string {
  const b = (body ?? {}) as Record<string, unknown>;
  for (const k of ['error_code', 'code', 'error']) if (typeof b[k] === 'string') return b[k] as string;
  return '';
}
