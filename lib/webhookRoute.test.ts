// @vitest-environment node
// POST /api/stripe/webhook — signature first, then only paid Checkout Sessions reach fulfilment.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signatureHeader } from './stripeCore';

vi.mock('server-only', () => ({}));
const fulfill = vi.fn();
vi.mock('@/lib/checkout', () => ({ fulfillCheckoutSession: (...args: unknown[]) => fulfill(...args) }));

const SECRET = 'whsec_test_route_0123456789abcdef';

function post(body: string, signature?: string | null) {
  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: signature ? { 'stripe-signature': signature, 'content-type': 'application/json' } : { 'content-type': 'application/json' },
  });
}
const now = () => Math.floor(Date.now() / 1000);
const event = (type: string, object: Record<string, unknown>) => JSON.stringify({ id: 'evt_test_1', type, data: { object } });
const session = { id: 'cs_test_a1B2c3D4e5F6g7H8i9', object: 'checkout.session', payment_status: 'paid' };

describe('POST /api/stripe/webhook', () => {
  const original = process.env.STRIPE_WEBHOOK_SECRET;
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = SECRET;
    fulfill.mockReset();
  });
  afterEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = original;
  });

  it('503 when the signing secret is not configured (Stripe retries later)', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const { POST } = await import('@/app/api/stripe/webhook/route');
    const body = event('checkout.session.completed', session);
    expect((await POST(post(body, signatureHeader(body, SECRET, now())))).status).toBe(503);
    expect(fulfill).not.toHaveBeenCalled();
  });

  it('400 for a missing, forged or stale signature — nothing is saved', async () => {
    const { POST } = await import('@/app/api/stripe/webhook/route');
    const body = event('checkout.session.completed', session);
    expect((await POST(post(body, null))).status).toBe(400);
    expect((await POST(post(body, signatureHeader(body, 'whsec_wrong_secret_value_123', now())))).status).toBe(400);
    expect((await POST(post(body, signatureHeader(body, SECRET, now() - 3600)))).status).toBe(400);
    expect((await POST(post(body.replace('paid', 'PAID'), signatureHeader(body, SECRET, now())))).status).toBe(400);
    expect(fulfill).not.toHaveBeenCalled();
  });

  it('saves the order for a signed, paid checkout.session.completed event', async () => {
    fulfill.mockResolvedValue({ ok: true, created: true, order: { id: 'o1' } });
    const { POST } = await import('@/app/api/stripe/webhook/route');
    const body = event('checkout.session.completed', session);
    const res = await POST(post(body, signatureHeader(body, SECRET, now())));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, fulfilled: true, created: true });
    expect(fulfill).toHaveBeenCalledTimes(1);
    expect(fulfill.mock.calls[0][0]).toMatchObject({ id: session.id });
  });

  it('a duplicate delivery is acknowledged without a second order', async () => {
    fulfill.mockResolvedValue({ ok: true, created: false, order: { id: 'o1' } });
    const { POST } = await import('@/app/api/stripe/webhook/route');
    const body = event('checkout.session.completed', session);
    const res = await POST(post(body, signatureHeader(body, SECRET, now())));
    expect(await res.json()).toEqual({ received: true, fulfilled: true, created: false });
  });

  it('ignores other events and unpaid sessions (200, no save)', async () => {
    const { POST } = await import('@/app/api/stripe/webhook/route');
    const other = event('payment_intent.created', { id: 'pi_1', object: 'payment_intent' });
    expect(await (await POST(post(other, signatureHeader(other, SECRET, now())))).json()).toEqual({ received: true, ignored: true });
    const unpaid = event('checkout.session.completed', { ...session, payment_status: 'unpaid' });
    expect(await (await POST(post(unpaid, signatureHeader(unpaid, SECRET, now())))).json()).toEqual({ received: true, pending: true });
    expect(fulfill).not.toHaveBeenCalled();
  });

  it('acknowledges (200) a signed session that does not match the server records, without saving', async () => {
    fulfill.mockResolvedValue({ ok: false, reason: 'mismatch' });
    const { POST } = await import('@/app/api/stripe/webhook/route');
    const body = event('checkout.session.completed', session);
    const res = await POST(post(body, signatureHeader(body, SECRET, now())));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true, fulfilled: false });
  });
});
