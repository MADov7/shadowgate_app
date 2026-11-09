import 'server-only';
import { connectDB } from './db';
import { Product, type ProductFields } from '@/models/Product';
import type { L10n, L10nList, Service } from '@/src/data/types';

// Server-side product loading for every page: products come from MongoDB Atlas (models/Product), sorted by the
// stored display order. There is no hardcoded fallback — if the database is unreachable the page shows the error
// screen instead of stale data.

const l10n = (v?: { en?: string | null; ar?: string | null } | null): L10n => ({ en: v?.en ?? '', ar: v?.ar ?? '' });
const l10nList = (v?: { en?: string[] | null; ar?: string[] | null } | null): L10nList => ({
  en: [...(v?.en ?? [])],
  ar: [...(v?.ar ?? [])],
});

/** Maps a Product document to the storefront's Service shape (plain, serialisable data). */
export function toService(doc: ProductFields): Service {
  const c = doc.content;
  return {
    id: doc.slug as Service['id'],
    audience: doc.audience as Service['audience'],
    category: doc.category as Service['category'],
    icon: doc.icon as Service['icon'],
    primaryAction: doc.primaryAction as Service['primaryAction'],
    ...(doc.layer ? { layer: doc.layer as Service['layer'] } : {}),
    featured: Boolean(doc.featured),
    requiresAuthorization: Boolean(doc.requiresAuthorization),
    image: doc.image,
    name: c?.name?.en ? l10n(c.name) : { en: doc.name, ar: doc.name },
    benefit: l10n(c?.benefit),
    audienceText: l10n(c?.audienceText),
    summary: c?.summary?.en ? l10n(c.summary) : { en: doc.description, ar: doc.description },
    scope: l10nList(c?.scope),
    exclusions: l10nList(c?.exclusions),
    deliverables: l10nList(c?.deliverables),
    duration: l10n(c?.duration),
    keywords: l10nList(c?.keywords),
    // Quote-based products keep their numeric price at 0 internally; the UI shows "Request a quote".
    pricing:
      doc.pricing?.kind === 'illustrative'
        ? { kind: 'illustrative', amount: doc.price, currency: 'USD', per: l10n(doc.pricing.per) }
        : { kind: 'quote' },
  };
}

export async function getProducts(): Promise<Service[]> {
  await connectDB();
  const docs = await Product.find({}).sort({ sortOrder: 1, createdAt: 1 }).lean<ProductFields[]>();
  return docs.map(toService);
}

export async function getProduct(slug: string): Promise<Service | null> {
  if (!/^[a-z0-9-]{2,64}$/.test(slug)) return null;
  await connectDB();
  const doc = await Product.findOne({ slug }).lean<ProductFields>();
  return doc ? toService(doc) : null;
}

/**
 * Products for pages that can still render without the database (Home, Products, Cart): if MongoDB is not
 * configured or unreachable, returns an empty list and `dbError: true` so the page shows an honest notice.
 * There is no hardcoded fallback catalog.
 */
export async function getProductsOrEmpty(): Promise<{ products: Service[]; dbError: boolean }> {
  try {
    return { products: await getProducts(), dbError: false };
  } catch (error) {
    const e = error as Error;
    console.error(`[catalog] database unavailable: ${e?.name ?? 'Error'}`);
    return { products: [], dbError: true };
  }
}
