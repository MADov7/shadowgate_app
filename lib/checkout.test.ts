// @vitest-environment node
// Server-side payment rules that must hold without a database or a real Stripe account:
// the Stripe client refuses live keys and never leaks the key, the success check is owner-only, and fulfilment
// refuses anything that does not match what the server itself wrote into the Checkout Session.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/** Builds a FAKE Stripe-shaped key at runtime (no key-like literal in the source, so secret scanners stay quiet). */
const fakeKey = (kind: string, mode: string, rest: string) => [kind, mode, rest].join('_');

vi.mock('server-only', () => ({}));
vi.mock('./supabase', async (orig) => {
  const real = await orig<typeof import('./supabase')>();
  const unreachable = vi.fn(async () => {
    throw new Error('the database must not be reached in these tests');
  });
  return { ...real, selectRows: unreachable, insertRow: unreachable, getAuthUser: unreachable };
});

const USER = '3f6c1a2e-8b4d-4c1e-9a7f-2b5d8e9c0a11';
const OTHER = '7a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';

function paidSession(over: Record<string, unknown> = {}) {
  return {
    id: 'cs_test_a1B2c3D4e5F6g7H8i9',
    object: 'checkout.session',
    url: null,
    mode: 'payment',
    status: 'complete',
    payment_status: 'paid',
    amount_total: 12700,
    currency: 'usd',
    client_reference_id: USER,
    payment_intent: 'pi_test_123',
    livemode: false,
    metadata: { sg_user: USER, sg_items: 'consultation:2:4900,scam-awareness:1:2900' },
    ...over,
  } as never;
}

describe('lib/stripe — key handling', () => {
  const original = process.env.STRIPE_SECRET_KEY;
  afterEach(() => {
    process.env.STRIPE_SECRET_KEY = original;
  });

  it('refuses to call Stripe without a key, or with a live key', async () => {
    const { createCheckoutSession, StripeKeyError } = await import('./stripe');
    const { MissingSecretError } = await import('./errors');
    const fetchImpl = vi.fn();
    delete process.env.STRIPE_SECRET_KEY;
    await expect(createCheckoutSession({}, fetchImpl)).rejects.toBeInstanceOf(MissingSecretError);
    process.env.STRIPE_SECRET_KEY = fakeKey('sk', 'live', '51AbCdEfGhIjKlMnOpQr');
    await expect(createCheckoutSession({}, fetchImpl)).rejects.toBeInstanceOf(StripeKeyError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('sends the key only in the Authorization header and maps errors without exposing it', async () => {
    const { createCheckoutSession, StripeApiError } = await import('./stripe');
    process.env.STRIPE_SECRET_KEY = fakeKey('sk', 'test', '51AbCdEfGhIjKlMnOpQr');
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ error: { type: 'invalid_request_error', code: 'parameter_missing', message: 'Invalid API Key provided: sk_test_****MnOpQr' } }), { status: 400 }));
    const err = await createCheckoutSession({ mode: 'payment' }, fetchImpl).catch((e: unknown) => e as InstanceType<typeof StripeApiError>);
    expect(err).toBeInstanceOf(StripeApiError);
    expect(err.status).toBe(400);
    expect(err.code).toBe('parameter_missing');
    expect(String(err.message)).not.toContain('sk_test');
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.stripe.com/v1/checkout/sessions');
    expect((init.headers as Record<string, string>).Authorization).toBe(`Bearer ${fakeKey('sk', 'test', '51AbCdEfGhIjKlMnOpQr')}`);
    expect(String(init.body)).toBe('mode=payment');
  });

  it('rejects a session id that is not a Checkout Session id before any request', async () => {
    const { retrieveCheckoutSession, StripeApiError } = await import('./stripe');
    process.env.STRIPE_SECRET_KEY = fakeKey('sk', 'test', '51AbCdEfGhIjKlMnOpQr');
    const fetchImpl = vi.fn();
    expect(() => retrieveCheckoutSession('cs_test_../../charges', fetchImpl)).toThrow(StripeApiError);
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe('lib/checkout — fulfilment checks (before any database write)', () => {
  it('only fixed-price services without an authorization requirement are payable', async () => {
    const { isPayableProduct } = await import('./checkout');
    expect(isPayableProduct({ pricing_kind: 'illustrative', price: 49, requires_authorization: false })).toBe(true);
    expect(isPayableProduct({ pricing_kind: 'quote', price: 0, requires_authorization: false })).toBe(false);
    expect(isPayableProduct({ pricing_kind: 'illustrative', price: 0, requires_authorization: false })).toBe(false);
    expect(isPayableProduct({ pricing_kind: 'illustrative', price: 49, requires_authorization: true })).toBe(false);
  });

  it('refuses unpaid, live-mode and tampered sessions', async () => {
    const { fulfillCheckoutSession } = await import('./checkout');
    expect(await fulfillCheckoutSession(paidSession({ payment_status: 'unpaid' }))).toEqual({ ok: false, reason: 'not_paid' });
    expect(await fulfillCheckoutSession(paidSession({ livemode: true }))).toEqual({ ok: false, reason: 'livemode' });
    // amount Stripe charged ≠ the lines the server priced
    expect(await fulfillCheckoutSession(paidSession({ amount_total: 100 }))).toEqual({ ok: false, reason: 'mismatch' });
    expect(await fulfillCheckoutSession(paidSession({ currency: 'eur' }))).toEqual({ ok: false, reason: 'mismatch' });
    // user in metadata ≠ client_reference_id, or missing/garbled metadata
    expect(await fulfillCheckoutSession(paidSession({ client_reference_id: OTHER }))).toEqual({ ok: false, reason: 'mismatch' });
    expect(await fulfillCheckoutSession(paidSession({ metadata: { sg_user: 'not-an-id', sg_items: 'consultation:1:4900' } }))).toEqual({ ok: false, reason: 'mismatch' });
    expect(await fulfillCheckoutSession(paidSession({ metadata: null }))).toEqual({ ok: false, reason: 'mismatch' });
    expect(await fulfillCheckoutSession(paidSession({ mode: 'subscription' }))).toEqual({ ok: false, reason: 'mismatch' });
  });
});

describe('lib/checkout — success-page confirmation is owner-only', () => {
  beforeEach(() => {
    vi.resetModules();
  });
  afterEach(() => {
    vi.doUnmock('./stripe');
  });

  it("returns 404 for another account's session and maps statuses", async () => {
    const retrieve = vi.fn();
    vi.doMock('./stripe', async (orig) => ({ ...(await orig<typeof import('./stripe')>()), retrieveCheckoutSession: retrieve }));
    const { confirmCheckoutForUser } = await import('./checkout');
    const { HttpError } = await import('./errors');

    retrieve.mockResolvedValueOnce(paidSession());
    const err = await confirmCheckoutForUser(OTHER, 'cs_test_a1B2c3D4e5F6g7H8i9').catch((e: unknown) => e as InstanceType<typeof HttpError>);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(404);

    retrieve.mockResolvedValueOnce(paidSession({ payment_status: 'unpaid', status: 'open' }));
    expect(await confirmCheckoutForUser(USER, 'cs_test_a1B2c3D4e5F6g7H8i9')).toEqual({ status: 'open' });
    retrieve.mockResolvedValueOnce(paidSession({ payment_status: 'unpaid', status: 'expired' }));
    expect(await confirmCheckoutForUser(USER, 'cs_test_a1B2c3D4e5F6g7H8i9')).toEqual({ status: 'expired' });
    retrieve.mockResolvedValueOnce(paidSession({ payment_status: 'unpaid', status: 'complete' }));
    expect(await confirmCheckoutForUser(USER, 'cs_test_a1B2c3D4e5F6g7H8i9')).toEqual({ status: 'processing' });
  });

  it('maps an unknown session (Stripe 404) to 404', async () => {
    const { StripeApiError } = await import('./stripe');
    vi.doMock('./stripe', async (orig) => ({
      ...(await orig<typeof import('./stripe')>()),
      retrieveCheckoutSession: vi.fn(async () => {
        throw new StripeApiError(404, 'invalid_request_error', 'resource_missing');
      }),
    }));
    const { confirmCheckoutForUser } = await import('./checkout');
    await expect(confirmCheckoutForUser(USER, 'cs_test_a1B2c3D4e5F6g7H8i9')).rejects.toMatchObject({ status: 404 });
  });
});
