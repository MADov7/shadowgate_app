// Seeds (or re-syncs) the Shadow Gate catalog into the Supabase table public.products through the REST API.
//   npm run seed          (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local)
// Repeatable: rows are upserted by their unique slug, so running it again updates the same 12 rows.
// (Alternative without a key on this PC: paste supabase/seed.sql into the Supabase SQL editor.)
import { MissingSecretError } from '../lib/errors';
import { selectRows, upsertRows } from '../lib/supabaseRest';
import { productRows } from './seed-rows';

try {
  const rows = productRows();
  const written = await upsertRows('products', rows, 'slug');
  const all = await selectRows<{ id: string }>('products', { select: 'id' }, 'service');
  console.log(`Seed complete ✓  upserted ${written} · products in Supabase: ${all.length}`);
} catch (error) {
  if (error instanceof MissingSecretError) console.error(`STOP: ${error.key} is not set. Add it to .env.local first.`);
  else console.error(`Seed failed: ${(error as Error).name}: ${(error as Error).message}`);
  process.exitCode = 1;
}
