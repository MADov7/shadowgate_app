// Pure Stripe helpers (no network, no database) — unit-tested in lib/stripeCore.test.ts.
// Shadow Gate talks to Stripe's REST API directly with fetch (lib/stripe.ts) instead of adding the `stripe` npm
// package, so these helpers do what that package would: form-encode request bodies, verify webhook signatures,
// and pack the paid cart into the Checkout Session metadata.
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------------------------------------------
// Keys: TEST MODE ONLY. This is classwork — a live key must never be used, so it is refused.
// ---------------------------------------------------------------------------------------------------------------

export type KeyCheck = { ok: true } | { ok: false; reason: 'missing' | 'live' | 'malformed' };

/** Accepts only Stripe *test* secret / restricted keys (sk_test_… / rk_test_…). */
export function checkTestSecretKey(key: string | undefined | null): KeyCheck {
  if (!key) return { ok: false, reason: 'missing' };
  if (/^(sk|rk)_live_/.test(key)) return { ok: false, reason: 'live' };
  if (!/^(sk|rk)_test_[A-Za-z0-9]{10,}$/.test(key)) return { ok: false, reason: 'malformed' };
  return { ok: true };
}

// ---------------------------------------------------------------------------------------------------------------
// application/x-www-form-urlencoded with Stripe's bracket syntax: line_items[0][price_data][currency]=usd
// ---------------------------------------------------------------------------------------------------------------

export type FormValue = string | number | boolean | null | undefined | FormValue[] | { [key: string]: FormValue };

export function encodeForm(params: Record<string, FormValue>): string {
  const out: string[] = [];
  const walk = (key: string, value: FormValue) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v, i) => walk(`${key}[${i}]`, v));
    } else if (typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) walk(`${key}[${k}]`, v);
    } else {
      out.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  };
  for (const [k, v] of Object.entries(params)) walk(k, v);
  return out.join('&');
}

// ---------------------------------------------------------------------------------------------------------------
// Webhook signatures — header "Stripe-Signature: t=<unix>,v1=<hex hmac>[,v1=…]", signed payload "<t>.<raw body>",
// HMAC-SHA256 with the endpoint's signing secret (whsec_…). Same rules as stripe.webhooks.constructEvent.
// ---------------------------------------------------------------------------------------------------------------

export const SIGNATURE_TOLERANCE_SECONDS = 300;

export type SignatureCheck = { ok: true; timestamp: number } | { ok: false; reason: 'missing' | 'malformed' | 'mismatch' | 'expired' };

export function signPayload(payload: string, secret: string, timestamp: number): string {
  return crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`, 'utf8').digest('hex');
}

/** Builds a valid Stripe-Signature header (used by tests and the local webhook test script). */
export function signatureHeader(payload: string, secret: string, timestamp: number): string {
  return `t=${timestamp},v1=${signPayload(payload, secret, timestamp)}`;
}

export function verifyStripeSignature(
  payload: string,
  header: string | null | undefined,
  secret: string,
  nowSeconds: number,
  toleranceSeconds = SIGNATURE_TOLERANCE_SECONDS,
): SignatureCheck {
  if (!header) return { ok: false, reason: 'missing' };
  let timestamp: number | null = null;
  const signatures: string[] = [];
  for (const part of header.split(',')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === 't' && /^\d{1,12}$/.test(value)) timestamp = Number(value);
    else if (key === 'v1' && /^[0-9a-f]{64}$/i.test(value)) signatures.push(value.toLowerCase());
  }
  if (timestamp === null || signatures.length === 0) return { ok: false, reason: 'malformed' };
  const expected = Buffer.from(signPayload(payload, secret, timestamp), 'hex');
  const matched = signatures.some((s) => crypto.timingSafeEqual(Buffer.from(s, 'hex'), expected));
  if (!matched) return { ok: false, reason: 'mismatch' };
  if (toleranceSeconds > 0 && nowSeconds - timestamp > toleranceSeconds) return { ok: false, reason: 'expired' };
  return { ok: true, timestamp };
}

// ---------------------------------------------------------------------------------------------------------------
// The paid cart, stored by the SERVER in the Checkout Session metadata ("slug:quantity:unitCents,…").
// Only the server (with the secret key) can write session metadata, so after payment it is the trusted record of
// what was bought and at which unit price; its sum must equal the session's amount_total.
// ---------------------------------------------------------------------------------------------------------------

export interface PaidLine {
  slug: string;
  quantity: number;
  unitCents: number;
}

/** Stripe metadata values are limited to 500 characters. */
export const METADATA_VALUE_MAX = 500;

export function encodeCartMetadata(lines: PaidLine[]): string {
  return lines.map((l) => `${l.slug}:${l.quantity}:${l.unitCents}`).join(',');
}

export function decodeCartMetadata(value: unknown): PaidLine[] | null {
  if (typeof value !== 'string' || value.length === 0 || value.length > METADATA_VALUE_MAX) return null;
  const lines: PaidLine[] = [];
  const seen = new Set<string>();
  for (const part of value.split(',')) {
    const m = /^([a-z0-9-]{2,64}):([1-9]\d?):(\d{1,8})$/.exec(part);
    if (!m) return null;
    const [, slug, q, c] = m;
    const quantity = Number(q);
    const unitCents = Number(c);
    if (quantity > 10 || unitCents < 1 || seen.has(slug)) return null;
    seen.add(slug);
    lines.push({ slug, quantity, unitCents });
  }
  return lines.length ? lines : null;
}

export function cartTotalCents(lines: PaidLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitCents * l.quantity, 0);
}

/** Whole-currency price (e.g. 49 USD) → integer cents for Stripe. */
export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Checkout Session ids look like cs_test_a1B2…; anything else is rejected before it reaches a URL path. */
export function isCheckoutSessionId(value: unknown): value is string {
  return typeof value === 'string' && /^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(value);
}
