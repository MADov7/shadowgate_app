import 'server-only';
import { selectRows } from './supabase';
import type { L10n, L10nList, Service } from '@/src/data/types';

// Server-side product loading for every page: products are read live from the Supabase table `public.products`
// (PostgREST, publishable/anon key — the table's Row Level Security policy allows public SELECT only), sorted by
// the stored display order. There is no hardcoded catalog in the app — if Supabase is unreachable the page shows
// an honest notice instead of stale data. Table definition: supabase/migrations/20261111000000_shadow_gate.sql.

type L10nJson = { en?: string | null; ar?: string | null } | null | undefined;
type L10nListJson = { en?: string[] | null; ar?: string[] | null } | null | undefined;

/** Bilingual texts stored in products.content (jsonb). */
export interface ProductContent {
  name?: L10nJson;
  benefit?: L10nJson;
  audienceText?: L10nJson;
  summary?: L10nJson;
  scope?: L10nListJson;
  exclusions?: L10nListJson;
  deliverables?: L10nListJson;
  duration?: L10nJson;
  keywords?: L10nListJson;
  /** Price unit, e.g. { en: 'per device', ar: 'لكل جهاز' } (illustrative prices only). */
  per?: L10nJson;
}

/** One row of public.products. */
export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number | string;
  image: string;
  category: string;
  audience: 'business' | 'personal';
  icon: string;
  primary_action: 'add' | 'quote' | 'book';
  layer: string | null;
  featured: boolean;
  requires_authorization: boolean;
  sort_order: number;
  pricing_kind: 'quote' | 'illustrative';
  currency: string;
  content: ProductContent | null;
  created_at?: string;
}

const l10n = (v?: L10nJson): L10n => ({ en: v?.en ?? '', ar: v?.ar ?? '' });
const l10nList = (v?: L10nListJson): L10nList => ({ en: [...(v?.en ?? [])], ar: [...(v?.ar ?? [])] });

export const productPrice = (row: Pick<ProductRow, 'price'>): number => Number(row.price) || 0;
export const productName = (row: Pick<ProductRow, 'name' | 'content'>) => ({ en: row.content?.name?.en || row.name, ar: row.content?.name?.ar ?? '' });

/** Maps a products row to the storefront's Service shape (plain, serialisable data). */
export function toService(row: ProductRow): Service {
  const c = row.content ?? {};
  return {
    id: row.slug as Service['id'],
    audience: row.audience as Service['audience'],
    category: row.category as Service['category'],
    icon: row.icon as Service['icon'],
    primaryAction: row.primary_action as Service['primaryAction'],
    ...(row.layer ? { layer: row.layer as Service['layer'] } : {}),
    featured: Boolean(row.featured),
    requiresAuthorization: Boolean(row.requires_authorization),
    image: row.image,
    name: c.name?.en ? l10n(c.name) : { en: row.name, ar: row.name },
    benefit: l10n(c.benefit),
    audienceText: l10n(c.audienceText),
    summary: c.summary?.en ? l10n(c.summary) : { en: row.description, ar: row.description },
    scope: l10nList(c.scope),
    exclusions: l10nList(c.exclusions),
    deliverables: l10nList(c.deliverables),
    duration: l10n(c.duration),
    keywords: l10nList(c.keywords),
    // Quote-based products keep their numeric price at 0 internally; the UI shows "Request a quote".
    pricing:
      row.pricing_kind === 'illustrative'
        ? { kind: 'illustrative', amount: productPrice(row), currency: 'USD', per: l10n(c.per) }
        : { kind: 'quote' },
  };
}

const SLUG = /^[a-z0-9-]{2,64}$/;

/** Raw rows for the given slugs (orders / checkout price lines from these). */
export async function getProductRows(slugs: string[]): Promise<ProductRow[]> {
  const valid = [...new Set(slugs)].filter((s) => SLUG.test(s));
  if (!valid.length) return [];
  return selectRows<ProductRow>('products', { select: '*', slug: `in.(${valid.join(',')})` });
}

export async function getProducts(): Promise<Service[]> {
  const rows = await selectRows<ProductRow>('products', { select: '*', order: 'sort_order.asc,created_at.asc' });
  return rows.map(toService);
}

export async function getProduct(slug: string): Promise<Service | null> {
  if (!SLUG.test(slug)) return null;
  const rows = await selectRows<ProductRow>('products', { select: '*', slug: `eq.${slug}`, limit: '1' });
  return rows[0] ? toService(rows[0]) : null;
}

/**
 * Products for pages that can still render without the database (Home, Products, Cart): if Supabase is not
 * configured or unreachable, returns an empty list and `dbError: true` so the page shows an honest notice.
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
