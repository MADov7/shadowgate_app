// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  cartTotalCents,
  checkTestSecretKey,
  decodeCartMetadata,
  encodeCartMetadata,
  encodeForm,
  isCheckoutSessionId,
  signatureHeader,
  signPayload,
  toCents,
  verifyStripeSignature,
} from './stripeCore';

/** Builds a FAKE Stripe-shaped key at runtime (no key-like literal in the source, so secret scanners stay quiet). */
const fakeKey = (kind: string, mode: string, rest: string) => [kind, mode, rest].join('_');
const SECRET = 'whsec_test_0123456789abcdefABCDEF';
const NOW = 1_762_700_000;

describe('checkTestSecretKey (test mode only)', () => {
  it('accepts test secret and restricted keys', () => {
    expect(checkTestSecretKey(fakeKey('sk', 'test', '51AbCdEfGhIjKlMnOp'))).toEqual({ ok: true });
    expect(checkTestSecretKey(fakeKey('rk', 'test', '51AbCdEfGhIjKlMnOp'))).toEqual({ ok: true });
  });
  it('refuses missing, live and malformed keys', () => {
    expect(checkTestSecretKey(undefined)).toEqual({ ok: false, reason: 'missing' });
    expect(checkTestSecretKey('')).toEqual({ ok: false, reason: 'missing' });
    expect(checkTestSecretKey(fakeKey('sk', 'live', '51AbCdEfGhIjKlMnOp'))).toEqual({ ok: false, reason: 'live' });
    expect(checkTestSecretKey(fakeKey('rk', 'live', '51AbCdEfGhIjKlMnOp'))).toEqual({ ok: false, reason: 'live' });
    expect(checkTestSecretKey(fakeKey('pk', 'test', '51AbCdEfGhIjKlMnOp'))).toEqual({ ok: false, reason: 'malformed' }); // publishable
    expect(checkTestSecretKey(fakeKey('sk', 'test', 'short'))).toEqual({ ok: false, reason: 'malformed' });
    expect(checkTestSecretKey(fakeKey('sk', 'test', '51AbCdEf GhIjKlMnOp'))).toEqual({ ok: false, reason: 'malformed' });
  });
});

describe('encodeForm (Stripe bracket syntax)', () => {
  it('encodes nested objects and arrays', () => {
    const body = encodeForm({
      mode: 'payment',
      line_items: [{ quantity: 2, price_data: { currency: 'usd', unit_amount: 4900, product_data: { name: 'A & B — Shadow Gate' } } }],
      metadata: { sg_items: 'consultation:2:4900' },
      skip: undefined,
      none: null,
    });
    const params = new URLSearchParams(body);
    expect(params.get('mode')).toBe('payment');
    expect(params.get('line_items[0][quantity]')).toBe('2');
    expect(params.get('line_items[0][price_data][unit_amount]')).toBe('4900');
    expect(params.get('line_items[0][price_data][product_data][name]')).toBe('A & B — Shadow Gate');
    expect(params.get('metadata[sg_items]')).toBe('consultation:2:4900');
    expect(body).not.toContain('skip');
    expect(body).not.toContain('none');
  });
  it('keeps the {CHECKOUT_SESSION_ID} placeholder intact after decoding', () => {
    const body = encodeForm({ success_url: 'https://x.test/checkout/success?session_id={CHECKOUT_SESSION_ID}' });
    expect(new URLSearchParams(body).get('success_url')).toBe('https://x.test/checkout/success?session_id={CHECKOUT_SESSION_ID}');
  });
});

describe('verifyStripeSignature (webhook)', () => {
  const payload = JSON.stringify({ id: 'evt_1', type: 'checkout.session.completed' });

  it('accepts a correct signature within the tolerance', () => {
    const header = signatureHeader(payload, SECRET, NOW - 10);
    expect(verifyStripeSignature(payload, header, SECRET, NOW)).toEqual({ ok: true, timestamp: NOW - 10 });
  });
  it('accepts when any of several v1 signatures matches (secret rotation)', () => {
    const good = signPayload(payload, SECRET, NOW);
    const header = `t=${NOW},v1=${'0'.repeat(64)},v1=${good},v0=abc`;
    expect(verifyStripeSignature(payload, header, SECRET, NOW).ok).toBe(true);
  });
  it('rejects a missing or malformed header', () => {
    expect(verifyStripeSignature(payload, null, SECRET, NOW)).toEqual({ ok: false, reason: 'missing' });
    expect(verifyStripeSignature(payload, 'garbage', SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' });
    expect(verifyStripeSignature(payload, `t=${NOW}`, SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' });
    expect(verifyStripeSignature(payload, `v1=${'a'.repeat(64)}`, SECRET, NOW)).toEqual({ ok: false, reason: 'malformed' });
  });
  it('rejects a tampered body, a wrong secret and a forged signature', () => {
    const header = signatureHeader(payload, SECRET, NOW);
    expect(verifyStripeSignature(payload.replace('evt_1', 'evt_2'), header, SECRET, NOW)).toEqual({ ok: false, reason: 'mismatch' });
    expect(verifyStripeSignature(payload, header, 'whsec_other_secret_value', NOW)).toEqual({ ok: false, reason: 'mismatch' });
    expect(verifyStripeSignature(payload, `t=${NOW},v1=${'f'.repeat(64)}`, SECRET, NOW)).toEqual({ ok: false, reason: 'mismatch' });
  });
  it('rejects a replayed (old) event', () => {
    const header = signatureHeader(payload, SECRET, NOW - 301);
    expect(verifyStripeSignature(payload, header, SECRET, NOW)).toEqual({ ok: false, reason: 'expired' });
  });
});

describe('cart metadata (server-written record of the paid lines)', () => {
  const lines = [
    { slug: 'consultation', quantity: 2, unitCents: 4900 },
    { slug: 'scam-awareness', quantity: 1, unitCents: 2900 },
  ];
  it('round-trips and sums', () => {
    const meta = encodeCartMetadata(lines);
    expect(meta).toBe('consultation:2:4900,scam-awareness:1:2900');
    expect(decodeCartMetadata(meta)).toEqual(lines);
    expect(cartTotalCents(lines)).toBe(12700);
  });
  it('rejects anything malformed', () => {
    for (const bad of [undefined, '', 'consultation', 'consultation:0:4900', 'consultation:11:4900', 'consultation:1:0', 'Consultation:1:4900', 'a:1:100,a:1:100', 'x'.repeat(501), 'consultation:1:4900,']) {
      expect(decodeCartMetadata(bad)).toBeNull();
    }
  });
});

describe('small helpers', () => {
  it('converts whole USD to cents', () => {
    expect(toCents(49)).toBe(4900);
    expect(toCents(19.99)).toBe(1999);
  });
  it('recognises Checkout Session ids only', () => {
    expect(isCheckoutSessionId('cs_test_a1B2c3D4e5F6g7H8')).toBe(true);
    expect(isCheckoutSessionId('cs_test_../../v1/charges')).toBe(false);
    expect(isCheckoutSessionId('pi_123')).toBe(false);
    expect(isCheckoutSessionId(42)).toBe(false);
  });
});

describe('normalizeSecretKey (values pasted into hosting dashboards)', () => {
  it('extracts the key from quotes, spaces, line breaks or a NAME= prefix', async () => {
    const { normalizeSecretKey } = await import('./stripeCore');
    const key = fakeKey('sk', 'test', '51AbCdEfGhIjKlMnOp');
    for (const raw of [key, ` ${key} `, `"${key}"`, `'${key}'`, `${key}\r\n`, `STRIPE_SECRET_KEY=${key}`, `STRIPE_SECRET_KEY="${key}"\n`]) {
      expect(normalizeSecretKey(raw)).toBe(key);
      expect(checkTestSecretKey(normalizeSecretKey(raw))).toEqual({ ok: true });
    }
    // a live key is still recognised as live (and refused)
    expect(checkTestSecretKey(normalizeSecretKey(`"${fakeKey('sk', 'live', '51AbCdEfGhIjKlMnOp')}"`))).toEqual({ ok: false, reason: 'live' });
    expect(normalizeSecretKey(undefined)).toBeUndefined();
  });
});
