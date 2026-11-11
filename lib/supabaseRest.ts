// Server-side Supabase client (REST over fetch — the same HTTP APIs supabase-js calls, without the npm package).
//
//   PostgREST  {SUPABASE_URL}/rest/v1/…   tables `products` (public read) and `orders` (Row Level Security: owner only)
//   Auth       {SUPABASE_URL}/auth/v1/…   Supabase Auth users: sign-up, password log-in, user lookup
//
// Keys come from the server environment only (.env.local locally; Netlify / Vercel environment variables in
// production — the "Replit Secrets" of the class brief). App code imports it through lib/supabase.ts, which adds
// 'server-only' so a browser import fails the build; seed scripts import this file directly. No key is ever logged
// or returned in a response.
//   SUPABASE_URL                 https://<project-ref>.supabase.co
//   SUPABASE_ANON_KEY            publishable / anon key — public reads (products) + password log-in; RLS applies
//   SUPABASE_SERVICE_ROLE_KEY    secret / service_role key — creates accounts and reads/writes orders on the server.
//                                Every orders query it runs is filtered by the user id taken from the verified session.
import { MissingSecretError } from './errors';
import { authErrorCode, cleanEnvValue, isPublicKey, isServerKey, normalizeSupabaseUrl, supabaseHeaders, supabaseKeyKind } from './supabaseCore';

/** Supabase answered with an error (status + safe code only — never the key or the request body). */
export class SupabaseError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly body: unknown = null,
  ) {
    super(`Supabase error ${status}${code ? ` (${code})` : ''}`);
    this.name = 'SupabaseError';
  }
}

/** Supabase could not be reached at all (DNS / network / timeout). */
export class SupabaseUnavailableError extends Error {
  constructor(public readonly reason: string) {
    super(`Supabase unreachable (${reason})`);
    this.name = 'SupabaseUnavailableError';
  }
}

export type SupabaseConfig = { url: string; anonKey: string; serviceKey: string | null };

function env(...names: string[]): string | undefined {
  for (const n of names) {
    const v = cleanEnvValue(process.env[n]);
    if (v) return v;
  }
  return undefined;
}

/** Project URL + keys. The anon key may be left out (the service key then serves public reads too). */
export function supabaseConfig(): SupabaseConfig {
  const url = normalizeSupabaseUrl(env('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL'));
  if (!url) throw new MissingSecretError('SUPABASE_URL');
  const service = env('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY');
  const serviceKey = service && isServerKey(supabaseKeyKind(service)) ? service : null;
  const anon = env('SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const anonKey = anon && isPublicKey(supabaseKeyKind(anon)) ? anon : serviceKey;
  if (!anonKey) throw new MissingSecretError('SUPABASE_ANON_KEY');
  return { url, anonKey, serviceKey };
}

/** Yes/no summary for /api/health (never a value or part of one). */
export function supabaseStatus() {
  const url = Boolean(normalizeSupabaseUrl(env('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL')));
  const anon = env('SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_PUBLISHABLE_KEY', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  const service = env('SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_SECRET_KEY');
  return {
    url,
    anonKey: anon ? (isPublicKey(supabaseKeyKind(anon)) ? 'ready' : 'wrong-kind') : 'missing',
    serviceKey: service ? (isServerKey(supabaseKeyKind(service)) ? 'ready' : 'wrong-kind') : 'missing',
  };
}

function serviceKeyOrThrow(cfg: SupabaseConfig): string {
  if (!cfg.serviceKey) throw new MissingSecretError('SUPABASE_SERVICE_ROLE_KEY');
  return cfg.serviceKey;
}

// Connection failures that happen before the request is sent (safe to retry once, even for POST).
const CONNECT_CODES = new Set(['ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'UND_ERR_CONNECT_TIMEOUT', 'ESERVFAIL', 'ETIMEOUT']);
function isConnectFailure(error: unknown): boolean {
  const e = error as { code?: string; cause?: unknown } | null;
  if (!e) return false;
  if (CONNECT_CODES.has(String(e.code ?? ''))) return true;
  return e.cause ? isConnectFailure(e.cause) : false;
}

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

async function call(url: string, init: RequestInit, fetchImpl: FetchLike = fetch): Promise<{ status: number; body: unknown }> {
  let res: Response | null = null;
  for (let attempt = 0; attempt < 2 && !res; attempt += 1) {
    try {
      res = await fetchImpl(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(12_000) });
    } catch (error) {
      if (attempt === 0 && isConnectFailure(error)) continue;
      const name = (error as Error)?.name === 'TimeoutError' ? 'timeout' : 'network';
      throw new SupabaseUnavailableError(name);
    }
  }
  const text = await res!.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  return { status: res!.status, body };
}

// ---------------------------------------------------------------------------------------------------------------
// PostgREST (tables)
// ---------------------------------------------------------------------------------------------------------------

type As = 'anon' | 'service';

/** SELECT rows. `query` uses PostgREST syntax, e.g. { select: '*', slug: 'eq.vpn', order: 'sort_order.asc' }. */
export async function selectRows<T>(table: string, query: Record<string, string>, as: As = 'anon', fetchImpl?: FetchLike): Promise<T[]> {
  const cfg = supabaseConfig();
  const key = as === 'service' ? serviceKeyOrThrow(cfg) : cfg.anonKey;
  const qs = new URLSearchParams(query).toString();
  const { status, body } = await call(`${cfg.url}/rest/v1/${table}?${qs}`, { method: 'GET', headers: { ...supabaseHeaders(key), Accept: 'application/json' } }, fetchImpl);
  if (status !== 200 || !Array.isArray(body)) throw new SupabaseError(status, String((body as { code?: unknown } | null)?.code ?? ''), body);
  return body as T[];
}

/** INSERT one row with the service key and return it (Prefer: return=representation). */
export async function insertRow<T>(table: string, row: Record<string, unknown>, fetchImpl?: FetchLike): Promise<T> {
  const cfg = supabaseConfig();
  const key = serviceKeyOrThrow(cfg);
  const { status, body } = await call(
    `${cfg.url}/rest/v1/${table}?select=*`,
    {
      method: 'POST',
      headers: { ...supabaseHeaders(key), 'Content-Type': 'application/json', Accept: 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(row),
    },
    fetchImpl,
  );
  if (status !== 201 || !Array.isArray(body) || !body[0]) throw new SupabaseError(status, String((body as { code?: unknown } | null)?.code ?? ''), body);
  return body[0] as T;
}

/** UPSERT rows by a unique column (seed script). */
export async function upsertRows(table: string, rows: Record<string, unknown>[], onConflict: string, fetchImpl?: FetchLike): Promise<number> {
  const cfg = supabaseConfig();
  const key = serviceKeyOrThrow(cfg);
  const { status, body } = await call(
    `${cfg.url}/rest/v1/${table}?on_conflict=${encodeURIComponent(onConflict)}&select=id`,
    {
      method: 'POST',
      headers: { ...supabaseHeaders(key), 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify(rows),
    },
    fetchImpl,
  );
  if (status !== 201 && status !== 200) throw new SupabaseError(status, String((body as { code?: unknown } | null)?.code ?? ''), body);
  return Array.isArray(body) ? body.length : 0;
}

// ---------------------------------------------------------------------------------------------------------------
// Supabase Auth
// ---------------------------------------------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  created_at?: string | null;
  last_sign_in_at?: string | null;
  banned_until?: string | null;
  user_metadata?: { name?: string } | null;
}

/** A user banned in the Supabase dashboard (banned_until in the future) is treated like a removed account. */
function isBanned(user: AuthUser, now: number = Date.now()): boolean {
  if (!user.banned_until) return false;
  const until = Date.parse(user.banned_until);
  return Number.isFinite(until) && until > now;
}

/** Creates a Supabase Auth user (email already confirmed — the class store sends no emails). 409 if the email exists. */
export async function createAuthUser(input: { email: string; password: string; name: string }, fetchImpl?: FetchLike): Promise<AuthUser> {
  const cfg = supabaseConfig();
  const key = serviceKeyOrThrow(cfg);
  const { status, body } = await call(
    `${cfg.url}/auth/v1/admin/users`,
    {
      method: 'POST',
      headers: { ...supabaseHeaders(key), 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: input.email, password: input.password, email_confirm: true, user_metadata: { name: input.name } }),
    },
    fetchImpl,
  );
  if (status === 200 || status === 201) return body as AuthUser;
  throw new SupabaseError(status, authErrorCode(body), body);
}

/** Supabase Auth password log-in. Returns the user, or null for wrong email/password. */
export async function signInWithPassword(email: string, password: string, fetchImpl?: FetchLike): Promise<AuthUser | null> {
  const cfg = supabaseConfig();
  const { status, body } = await call(
    `${cfg.url}/auth/v1/token?grant_type=password`,
    { method: 'POST', headers: { ...supabaseHeaders(cfg.anonKey), 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) },
    fetchImpl,
  );
  if (status === 200) {
    const user = (body as { user?: AuthUser } | null)?.user;
    if (user?.id) return user;
    throw new SupabaseError(status, 'invalid_response');
  }
  const code = authErrorCode(body);
  // Wrong password, unknown email, unconfirmed or banned account: all answered as "incorrect email or password".
  if (status === 400 && ['invalid_credentials', 'invalid_grant', 'email_not_confirmed', 'user_banned'].includes(code)) return null;
  throw new SupabaseError(status, code, body);
}

/** Looks up a Supabase Auth user by id (server only). null if the account no longer exists or is banned. */
export async function getAuthUser(id: string, fetchImpl?: FetchLike): Promise<AuthUser | null> {
  const cfg = supabaseConfig();
  const key = serviceKeyOrThrow(cfg);
  const { status, body } = await call(`${cfg.url}/auth/v1/admin/users/${encodeURIComponent(id)}`, { method: 'GET', headers: supabaseHeaders(key) }, fetchImpl);
  if (status === 200 && (body as AuthUser | null)?.id) return isBanned(body as AuthUser) ? null : (body as AuthUser);
  if (status === 404) return null;
  throw new SupabaseError(status, authErrorCode(body), body);
}
