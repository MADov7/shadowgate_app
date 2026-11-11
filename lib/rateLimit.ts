// Small fixed-window rate limiter for the sign-up and log-in routes (in memory, per server instance).
// Supabase Auth also rate-limits, but it sees only this server's IP address (every visitor's password check is
// sent from the server), so the app throttles per visitor IP — and per IP + email for log-ins — before calling it.
// Best effort on serverless hosting (each warm instance keeps its own counters), which is enough to stop casual
// password guessing and mass sign-ups in this classwork store.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 10_000;

export type LimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/** Counts one attempt for `key`; refuses once `limit` attempts happened inside the current `windowMs`. */
export function hit(key: string, limit: number, windowMs: number, now: number = Date.now()): LimitResult {
  let bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_KEYS) {
      for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
      if (buckets.size >= MAX_KEYS) buckets.clear();
    }
    bucket = { count: 0, resetAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > limit) return { ok: false, retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) };
  return { ok: true };
}

/** Test helper. */
export function resetRateLimits(): void {
  buckets.clear();
}

/** The visitor's IP as reported by the hosting proxy (Netlify / Vercel), or "local". */
export function clientIp(request: Request): string {
  const h = request.headers;
  const candidate =
    h.get('x-nf-client-connection-ip') ?? h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0] ?? '';
  const ip = candidate.trim();
  return /^[0-9a-fA-F:.]{2,45}$/.test(ip) ? ip : 'local';
}

const FIVE_MIN = 5 * 60 * 1000;
const TEN_MIN = 10 * 60 * 1000;

/** Log-in: 10 tries per email per IP and 80 per IP every 5 minutes. */
export function limitLogin(request: Request, email: string): LimitResult {
  const ip = clientIp(request);
  const perAccount = hit(`login:${ip}:${email}`, 10, FIVE_MIN);
  if (!perAccount.ok) return perAccount;
  return hit(`login-ip:${ip}`, 80, FIVE_MIN);
}

/** Sign-up: 40 new accounts per IP every 10 minutes. */
export function limitSignup(request: Request): LimitResult {
  return hit(`signup:${clientIp(request)}`, 40, TEN_MIN);
}
