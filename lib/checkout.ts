import 'server-only';
// Day 5 — Stripe Checkout (TEST MODE) for the cart, on top of the Day 4 store (Supabase table + Supabase Auth).
// Class brief → this project:  "Supabase Edge Function" → the Next.js server route POST /api/checkout;
//                              "Supabase Secrets"       → STRIPE_SECRET_KEY in the server environment;
//                              "orders table"           → the Supabase table `public.orders`.
//
// Flow: the cart sends product slugs + quantities → the server prices them FROM THE DATABASE and creates a Stripe
// Checkout Session (amounts, user and paid lines are written by the server) → the visitor pays on Stripe's page →
// Stripe redirects to /checkout/success, which asks POST /api/checkout/confirm; the server re-reads the session
// from Stripe and, once it is paid, saves the order with status "paid". The webhook (bonus) does the same from
// Stripe's side. orders.stripe_session_id is UNIQUE, so whichever arrives first saves the order and the other reuses it.
import { getProductRows, productName, productPrice, type ProductRow } from './catalog';
import { HttpError } from './errors';
import { publicOrder, type OrderItemRow, type OrderRow } from './orders';
import { createCheckoutSession, retrieveCheckoutSession, StripeApiError, type CheckoutSession } from './stripe';
import { cartTotalCents, decodeCartMetadata, encodeCartMetadata, METADATA_VALUE_MAX, toCents, type PaidLine } from './stripeCore';
import { getAuthUser, insertRow, selectRows, SupabaseError } from './supabase';
import { isUniqueViolation, isUuid } from './supabaseCore';
import type { CheckoutInput } from './validators';
import type { PublicOrder } from '@/src/data/orderTypes';

export const CHECKOUT_CURRENCY = 'usd';
/** Checkout Session metadata keys (written by this server only). */
export const META_USER = 'sg_user';
export const META_ITEMS = 'sg_items';
/** How long a Checkout Session stays payable (Stripe allows 30 minutes – 24 hours). */
const SESSION_LIFETIME_SECONDS = 60 * 60;

/** Only fixed (illustrative) prices can be paid online; quote-based services are priced after a scoping call. */
export function isPayableProduct(p: Pick<ProductRow, 'pricing_kind' | 'price' | 'requires_authorization'>): boolean {
  return p.pricing_kind === 'illustrative' && productPrice(p) > 0 && !p.requires_authorization;
}

/** Creates the Stripe Checkout Session for the signed-in user's payable cart lines. Returns Stripe's hosted URL. */
export async function startCheckout(userId: string, input: CheckoutInput, origin: string): Promise<{ url: string; sessionId: string }> {
  if (!isUuid(userId)) throw new HttpError(401, 'Your session is not valid. Please log in again.', { reason: 'invalid' });
  const slugs = input.items.map((i) => i.slug);
  const [user, products] = await Promise.all([getAuthUser(userId), getProductRows(slugs)]);
  if (!user) throw new HttpError(401, 'Your session is not valid. Please log in again.', { reason: 'invalid' });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const unknown = slugs.filter((s) => !bySlug.has(s));
  if (unknown.length) throw new HttpError(400, 'Some selected products no longer exist.', { unknown });
  const notPayable = slugs.filter((s) => !isPayableProduct(bySlug.get(s)!));
  if (notPayable.length) {
    throw new HttpError(400, 'Only fixed-price services can be paid online. Send quote-based services with the request form.', { notPayable });
  }

  // Unit prices come from Supabase (products.price, USD) — never from the browser.
  const lines: PaidLine[] = input.items.map((i) => ({ slug: i.slug, quantity: i.quantity, unitCents: toCents(productPrice(bySlug.get(i.slug)!)) }));
  const itemsMeta = encodeCartMetadata(lines);
  if (itemsMeta.length > METADATA_VALUE_MAX) throw new HttpError(400, 'Too many services for one payment.');

  const session = await createCheckoutSession({
    mode: 'payment',
    submit_type: 'pay',
    client_reference_id: userId,
    customer_email: user.email,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    expires_at: Math.floor(Date.now() / 1000) + SESSION_LIFETIME_SECONDS,
    line_items: lines.map((l) => ({
      quantity: l.quantity,
      price_data: {
        currency: CHECKOUT_CURRENCY,
        unit_amount: l.unitCents,
        product_data: { name: `${productName(bySlug.get(l.slug)!).en} — Shadow Gate`, metadata: { slug: l.slug } },
      },
    })),
    metadata: { [META_USER]: userId, [META_ITEMS]: itemsMeta },
    payment_intent_data: { metadata: { [META_USER]: userId } },
  });

  // Only ever send the browser to Stripe's own checkout host.
  let host = '';
  try {
    host = session.url ? new URL(session.url).hostname : '';
  } catch {
    host = '';
  }
  if (!session.url || !(host === 'checkout.stripe.com' || host.endsWith('.stripe.com'))) {
    throw new StripeApiError(502, 'invalid_response', 'unexpected_checkout_url');
  }
  return { url: session.url, sessionId: session.id };
}

export type FulfilResult =
  | { ok: true; order: PublicOrder; created: boolean }
  | { ok: false; reason: 'not_paid' | 'livemode' | 'mismatch' | 'unknown_product' };

/** Existing order for a Checkout Session (idempotency), read with the server key. */
async function orderForSession(sessionId: string): Promise<OrderRow | null> {
  const rows = await selectRows<OrderRow>('orders', { select: '*', stripe_session_id: `eq.${sessionId}`, limit: '1' }, 'service');
  return rows[0] ?? null;
}

/**
 * Saves the paid order for a Checkout Session (idempotent: one order per session id). Called by the success-page
 * check and by the webhook. Everything is checked against what the SERVER wrote into the session: the user id,
 * the paid lines, and that Stripe's amount_total equals their sum.
 */
export async function fulfillCheckoutSession(session: CheckoutSession): Promise<FulfilResult> {
  if (session.object !== 'checkout.session' || session.mode !== 'payment') return { ok: false, reason: 'mismatch' };
  if (session.livemode) return { ok: false, reason: 'livemode' };
  if (session.payment_status !== 'paid') return { ok: false, reason: 'not_paid' };
  const userId = session.metadata?.[META_USER];
  const lines = decodeCartMetadata(session.metadata?.[META_ITEMS]);
  if (!userId || !isUuid(userId) || session.client_reference_id !== userId || !lines) return { ok: false, reason: 'mismatch' };
  if ((session.currency ?? '').toLowerCase() !== CHECKOUT_CURRENCY || session.amount_total !== cartTotalCents(lines)) {
    return { ok: false, reason: 'mismatch' };
  }

  const existing = await orderForSession(session.id);
  if (existing) return { ok: true, order: publicOrder(existing), created: false };

  const products = await getProductRows(lines.map((l) => l.slug));
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  if (lines.some((l) => !bySlug.has(l.slug))) return { ok: false, reason: 'unknown_product' };

  const items: OrderItemRow[] = lines.map((l) => {
    const p = bySlug.get(l.slug)!;
    return { product_id: p.id, slug: l.slug, name: productName(p), quantity: l.quantity, price: l.unitCents / 100, pricing_kind: 'illustrative' };
  });
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : (session.payment_intent?.id ?? null);
  try {
    const row = await insertRow<OrderRow>('orders', {
      user_id: userId,
      items,
      total: session.amount_total / 100,
      has_quote_items: false,
      status: 'paid',
      request_type: products.every((p) => p.audience === 'personal') ? 'personal' : 'business',
      payment_method: 'stripe',
      stripe_session_id: session.id,
      payment_intent_id: paymentIntentId,
      currency: CHECKOUT_CURRENCY,
      amount_paid_cents: session.amount_total,
      paid_at: new Date().toISOString(),
    });
    return { ok: true, order: publicOrder(row), created: true };
  } catch (error) {
    // The webhook and the success page arrived at the same moment: the other one already saved it.
    if (error instanceof SupabaseError && isUniqueViolation(error.status, error.body)) {
      const again = await orderForSession(session.id);
      if (again) return { ok: true, order: publicOrder(again), created: false };
    }
    throw error;
  }
}

export type ConfirmResult = { status: 'paid'; order: PublicOrder } | { status: 'processing' | 'open' | 'expired' };

/** Success page check: the session must belong to the signed-in user; once paid, the order is saved and returned. */
export async function confirmCheckoutForUser(userId: string, sessionId: string): Promise<ConfirmResult> {
  let session: CheckoutSession;
  try {
    session = await retrieveCheckoutSession(sessionId);
  } catch (error) {
    if (error instanceof StripeApiError && (error.status === 404 || error.status === 400)) throw new HttpError(404, 'Payment session not found.');
    throw error;
  }
  // Another account's session id is reported exactly like an unknown one.
  if (session.client_reference_id !== userId || session.metadata?.[META_USER] !== userId) throw new HttpError(404, 'Payment session not found.');
  if (session.payment_status === 'paid') {
    const result = await fulfillCheckoutSession(session);
    if (result.ok) return { status: 'paid', order: result.order };
    console.error(`[checkout] paid session could not be fulfilled: ${result.reason}`);
    throw new HttpError(409, 'This payment could not be matched to an order. Please contact us — nothing will be charged twice.');
  }
  if (session.status === 'expired') return { status: 'expired' };
  if (session.status === 'complete') return { status: 'processing' };
  return { status: 'open' };
}
