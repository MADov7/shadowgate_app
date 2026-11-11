// Read-only check of the Supabase setup: settings present, tables reachable, product count, RLS on orders.
//   npm run db:check
// Prints yes/no and counts only — never a key, URL or row content.
import { selectRows, supabaseStatus } from '../lib/supabaseRest';

const status = supabaseStatus();
console.log(`SUPABASE_URL: ${status.url ? 'set' : 'MISSING'} · anon key: ${status.anonKey} · service key: ${status.serviceKey}`);
const publicKey = status.anonKey === 'ready';
try {
  const products = await selectRows<{ slug: string }>('products', { select: 'slug' }, 'anon');
  console.log(`products (${publicKey ? 'public read through RLS' : 'read with the server key — no public key set'}): ${products.length}`);
  if (status.serviceKey === 'ready') {
    const orders = await selectRows<{ id: string }>('orders', { select: 'id' }, 'service');
    console.log(`orders (server key): ${orders.length}`);
  }
  if (publicKey) {
    const anonOrders = await selectRows<{ id: string }>('orders', { select: 'id' }, 'anon');
    console.log(`orders visible to an anonymous visitor (must be 0): ${anonOrders.length}`);
    if (anonOrders.length > 0) {
      console.error('RLS PROBLEM: anonymous visitors can read orders.');
      process.exitCode = 1;
    }
  } else {
    console.log('RLS probe skipped: set SUPABASE_ANON_KEY (publishable key) to test what anonymous visitors can see.');
  }
  if (!process.exitCode) console.log('Supabase OK ✓');
} catch (error) {
  console.error(`Supabase check failed: ${(error as Error).name}: ${(error as Error).message}`);
  process.exitCode = 1;
}
