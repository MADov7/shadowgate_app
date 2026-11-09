// Seeds (or re-syncs) the Shadow Gate catalog into MongoDB Atlas.
//   npm run seed
// Repeatable: each product is upserted by its stable slug (unique index), so running it again updates the same
// 12 documents instead of creating duplicates. Prices: illustrative products store their classwork price; quote-based
// products store price 0 with pricing.kind = 'quote' (the UI shows "Request a quote", never "$0").
import mongoose from 'mongoose';
import { connectDB, MissingSecretError } from '../lib/db';
import { Product } from '../models/Product';
import { SEED_SERVICES } from './seed/catalog-data';

try {
  await connectDB();
  await Product.syncIndexes();
  let created = 0;
  let updated = 0;
  for (const [index, s] of SEED_SERVICES.entries()) {
    const doc = {
      // SKILL.md fields
      name: s.name.en,
      description: s.summary.en,
      price: s.pricing.kind === 'illustrative' ? s.pricing.amount : 0,
      image: `/images/products/${s.id}.svg`,
      category: s.category,
      // storefront fields
      slug: s.id,
      audience: s.audience,
      icon: s.icon,
      primaryAction: s.primaryAction,
      layer: s.layer,
      featured: Boolean(s.featured),
      requiresAuthorization: Boolean(s.requiresAuthorization),
      sortOrder: index + 1,
      pricing:
        s.pricing.kind === 'illustrative'
          ? { kind: 'illustrative', currency: s.pricing.currency, per: s.pricing.per }
          : { kind: 'quote', currency: 'USD', per: { en: '', ar: '' } },
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
      },
    };
    const res = await Product.updateOne({ slug: s.id }, { $set: doc }, { upsert: true, runValidators: true });
    if (res.upsertedCount) created += 1;
    else updated += 1;
  }
  const total = await Product.countDocuments();
  console.log(`Seed complete ✓  created ${created}, updated ${updated} · products in database: ${total}`);
} catch (error) {
  if (error instanceof MissingSecretError) {
    console.error(`STOP: ${error.key} is not set. Add it to .env.local first.`);
  } else {
    const e = error as Error;
    console.error(`Seed failed: ${e.name}: ${e.message.replace(/mongodb(\+srv)?:\/\/[^\s]+/g, '[hidden URI]')}`);
  }
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
