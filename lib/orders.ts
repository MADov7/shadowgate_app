import 'server-only';
import mongoose from 'mongoose';
import { connectDB } from './db';
import { HttpError } from './errors';
import type { OrderInput } from './validators';
import { Order, type OrderFields } from '@/models/Order';
import { Product, type ProductFields } from '@/models/Product';
import { getPackage, isPackageId } from '@/src/data/packages';
import type { PublicOrder, PublicOrderItem } from '@/src/data/orderTypes';

export type { PublicOrder, PublicOrderItem };

// Orders are created and read ONLY for the user id taken from the verified session token.

type OrderDoc = OrderFields & { _id: unknown; createdAt?: Date };

export function publicOrder(doc: OrderDoc): PublicOrder {
  return {
    id: String(doc._id),
    status: doc.status as PublicOrder['status'],
    total: doc.total,
    hasQuoteItems: Boolean(doc.hasQuoteItems),
    packageSlug: doc.packageSlug ?? null,
    requestType: (doc.requestType as PublicOrder['requestType']) ?? 'business',
    organisation: doc.organisation ?? '',
    message: doc.message ?? '',
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : null,
    paymentMethod: doc.paymentMethod === 'stripe' ? 'stripe' : null,
    paidAt: doc.paidAt ? new Date(doc.paidAt).toISOString() : null,
    items: (doc.items ?? []).map((i) => ({
      slug: i.slug,
      name: { en: i.name?.en ?? i.slug, ar: i.name?.ar ?? '' },
      quantity: i.quantity,
      price: i.price,
      pricingKind: i.pricingKind as PublicOrderItem['pricingKind'],
    })),
  };
}

/**
 * Creates a pending order for `userId`. Products, unit prices and the total come from the database:
 *  - illustrative-priced products: unit price = Product.price, counted in `total`;
 *  - quote-based products (and everything inside a package, which is quote-based) : price 0, `hasQuoteItems`.
 */
export async function createOrderForUser(userId: string, input: OrderInput): Promise<PublicOrder> {
  await connectDB();
  const packageSlugs = input.packageSlug && isPackageId(input.packageSlug) ? [...getPackage(input.packageSlug).includes] : [];
  const slugs = [...new Set([...input.items.map((i) => i.slug), ...packageSlugs])];
  const products = await Product.find({ slug: { $in: slugs } }).lean<Array<ProductFields & { _id: mongoose.Types.ObjectId }>>();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const unknown = slugs.filter((s) => !bySlug.has(s));
  if (unknown.length) throw new HttpError(400, 'Some selected products no longer exist.', { unknown });

  const lines: Array<OrderFields['items'][number]> = [];
  // Penetration testing (and any package containing it) requires the ownership/authorization confirmation.
  if (products.some((p) => p.requiresAuthorization) && !input.authorizationConfirmed) {
    throw new HttpError(400, 'Please confirm you own the systems or have written authorization to test them.', { fields: { authorization: 'required' } });
  }

  for (const item of input.items) {
    const p = bySlug.get(item.slug)!;
    const illustrative = p.pricing?.kind === 'illustrative';
    lines.push({
      product: p._id,
      quantity: item.quantity,
      price: illustrative ? p.price : 0,
      pricingKind: illustrative ? 'illustrative' : 'quote',
      slug: p.slug,
      name: { en: p.content?.name?.en || p.name, ar: p.content?.name?.ar ?? '' },
    } as OrderFields['items'][number]);
  }
  for (const slug of packageSlugs) {
    if (input.items.some((i) => i.slug === slug)) continue;
    const p = bySlug.get(slug)!;
    lines.push({
      product: p._id,
      quantity: 1,
      price: 0,
      pricingKind: 'quote',
      slug: p.slug,
      name: { en: p.content?.name?.en || p.name, ar: p.content?.name?.ar ?? '' },
    } as OrderFields['items'][number]);
  }

  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const order = await Order.create({
    user: new mongoose.Types.ObjectId(userId),
    items: lines,
    total,
    hasQuoteItems: lines.some((l) => l.pricingKind === 'quote'),
    status: 'pending',
    packageSlug: input.packageSlug,
    authorizationConfirmed: input.authorizationConfirmed,
    requestType: input.requestType,
    organisation: input.organisation,
    phone: input.phone,
    message: input.message,
  });
  return publicOrder(order.toObject() as OrderDoc);
}

/** All orders of one user, newest first. */
export async function listOrdersForUser(userId: string): Promise<PublicOrder[]> {
  await connectDB();
  const docs = await Order.find({ user: userId }).sort({ createdAt: -1 }).limit(100).lean<OrderDoc[]>();
  return docs.map(publicOrder);
}

/** One order — matched by BOTH its id and its owner, so another user's order id returns null (404). */
export async function getOrderForUser(userId: string, orderId: string): Promise<PublicOrder | null> {
  if (!mongoose.isValidObjectId(orderId)) return null;
  await connectDB();
  const doc = await Order.findOne({ _id: orderId, user: userId }).lean<OrderDoc>();
  return doc ? publicOrder(doc) : null;
}
