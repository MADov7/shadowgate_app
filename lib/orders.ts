import 'server-only';
import { getProductRows, productName, productPrice, type ProductRow } from './catalog';
import { HttpError } from './errors';
import { insertRow, selectRows } from './supabase';
import { isUuid } from './supabaseCore';
import type { OrderInput } from './validators';
import { getPackage, isPackageId } from '@/src/data/packages';
import type { PublicOrder, PublicOrderItem } from '@/src/data/orderTypes';

export type { PublicOrder, PublicOrderItem };

// Orders live in the Supabase table `public.orders` (Row Level Security on: a signed-in Supabase user can only
// SELECT rows whose user_id is their own id). The server reads and writes them with the service key, and EVERY
// query is filtered by the user id taken from the verified session cookie — never from the browser.

/** One line stored in orders.items (jsonb): a snapshot, so past orders still read correctly if a product changes. */
export interface OrderItemRow {
  product_id: string;
  slug: string;
  name: { en: string; ar: string };
  quantity: number;
  /** Unit price at order time (server-derived, USD). 0 for quote-based items. */
  price: number;
  pricing_kind: 'quote' | 'illustrative';
}

/** One row of public.orders. */
export interface OrderRow {
  id: string;
  user_id: string;
  items: OrderItemRow[];
  total: number | string;
  has_quote_items: boolean;
  status: 'pending' | 'paid';
  package_slug: string | null;
  request_type: 'business' | 'personal';
  organisation: string;
  phone: string;
  message: string;
  authorization_confirmed: boolean;
  payment_method: 'stripe' | null;
  stripe_session_id: string | null;
  payment_intent_id: string | null;
  currency: string;
  amount_paid_cents: number | null;
  paid_at: string | null;
  created_at: string | null;
}

export function publicOrder(row: OrderRow): PublicOrder {
  return {
    id: row.id,
    status: row.status === 'paid' ? 'paid' : 'pending',
    total: Number(row.total) || 0,
    hasQuoteItems: Boolean(row.has_quote_items),
    packageSlug: row.package_slug ?? null,
    requestType: row.request_type === 'personal' ? 'personal' : 'business',
    organisation: row.organisation ?? '',
    message: row.message ?? '',
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    paymentMethod: row.payment_method === 'stripe' ? 'stripe' : null,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    items: (Array.isArray(row.items) ? row.items : []).map((i) => ({
      slug: i.slug,
      name: { en: i.name?.en ?? i.slug, ar: i.name?.ar ?? '' },
      quantity: Number(i.quantity) || 1,
      price: Number(i.price) || 0,
      pricingKind: i.pricing_kind === 'illustrative' ? 'illustrative' : 'quote',
    })),
  };
}

function line(p: ProductRow, quantity: number, price: number, kind: OrderItemRow['pricing_kind']): OrderItemRow {
  return { product_id: p.id, slug: p.slug, name: productName(p), quantity, price, pricing_kind: kind };
}

/**
 * Creates a pending order for `userId`. Products, unit prices and the total come from the database:
 *  - illustrative-priced products: unit price = products.price, counted in `total`;
 *  - quote-based products (and everything inside a package, which is quote-based): price 0, `has_quote_items`.
 */
export async function createOrderForUser(userId: string, input: OrderInput): Promise<PublicOrder> {
  if (!isUuid(userId)) throw new HttpError(401, 'Your session is not valid. Please log in again.', { reason: 'invalid' });
  const packageSlugs = input.packageSlug && isPackageId(input.packageSlug) ? [...getPackage(input.packageSlug).includes] : [];
  const slugs = [...new Set([...input.items.map((i) => i.slug), ...packageSlugs])];
  const products = await getProductRows(slugs);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const unknown = slugs.filter((s) => !bySlug.has(s));
  if (unknown.length) throw new HttpError(400, 'Some selected products no longer exist.', { unknown });

  // Penetration testing (and any package containing it) requires the ownership/authorization confirmation.
  if (products.some((p) => p.requires_authorization) && !input.authorizationConfirmed) {
    throw new HttpError(400, 'Please confirm you own the systems or have written authorization to test them.', { fields: { authorization: 'required' } });
  }

  const lines: OrderItemRow[] = [];
  for (const item of input.items) {
    const p = bySlug.get(item.slug)!;
    const illustrative = p.pricing_kind === 'illustrative';
    lines.push(line(p, item.quantity, illustrative ? productPrice(p) : 0, illustrative ? 'illustrative' : 'quote'));
  }
  for (const slug of packageSlugs) {
    if (input.items.some((i) => i.slug === slug)) continue;
    lines.push(line(bySlug.get(slug)!, 1, 0, 'quote'));
  }

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const row = await insertRow<OrderRow>('orders', {
    user_id: userId,
    items: lines,
    total,
    has_quote_items: lines.some((l) => l.pricing_kind === 'quote'),
    status: 'pending',
    package_slug: input.packageSlug,
    authorization_confirmed: input.authorizationConfirmed,
    request_type: input.requestType,
    organisation: input.organisation,
    phone: input.phone,
    message: input.message,
  });
  return publicOrder(row);
}

/** All orders of one user, newest first. */
export async function listOrdersForUser(userId: string): Promise<PublicOrder[]> {
  if (!isUuid(userId)) return [];
  const rows = await selectRows<OrderRow>('orders', { select: '*', user_id: `eq.${userId}`, order: 'created_at.desc', limit: '100' }, 'service');
  return rows.map(publicOrder);
}

/** One order — matched by BOTH its id and its owner, so another user's order id returns null (404). */
export async function getOrderForUser(userId: string, orderId: string): Promise<PublicOrder | null> {
  if (!isUuid(userId) || !isUuid(orderId)) return null;
  const rows = await selectRows<OrderRow>('orders', { select: '*', id: `eq.${orderId}`, user_id: `eq.${userId}`, limit: '1' }, 'service');
  return rows[0] ? publicOrder(rows[0]) : null;
}
