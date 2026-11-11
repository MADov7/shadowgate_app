// Builds the public.products rows from the seed source (src/test/fixtures/catalog.fixture.ts).
// Used by scripts/seed-sql.ts (writes supabase/seed.sql) and scripts/seed.ts (upserts through the REST API).
// Prices: illustrative products store their classwork price; quote-based products store 0 with
// pricing_kind = 'quote' (the UI shows "Request a quote", never "$0").
import { SEED_SERVICES } from '../src/test/fixtures/catalog.fixture';

export function productRows() {
  return SEED_SERVICES.map((s, index) => ({
    slug: s.id,
    name: s.name.en,
    description: s.summary.en,
    price: s.pricing.kind === 'illustrative' ? s.pricing.amount : 0,
    image: `/images/products/${s.id}.svg`,
    category: s.category,
    audience: s.audience,
    icon: s.icon,
    primary_action: s.primaryAction,
    layer: s.layer ?? null,
    featured: Boolean(s.featured),
    requires_authorization: Boolean(s.requiresAuthorization),
    sort_order: index + 1,
    pricing_kind: s.pricing.kind,
    currency: 'USD',
    content: {
      name: s.name,
      benefit: s.benefit,
      audienceText: s.audienceText,
      summary: s.summary,
      scope: s.scope,
      exclusions: s.exclusions,
      deliverables: s.deliverables,
      duration: s.duration,
      keywords: s.keywords ?? { en: [], ar: [] },
      per: s.pricing.kind === 'illustrative' ? s.pricing.per : { en: '', ar: '' },
    },
  }));
}
