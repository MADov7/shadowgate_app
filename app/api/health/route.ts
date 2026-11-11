import { json } from '@/lib/http';
import { checkTestSecretKey, normalizeSecretKey } from '@/lib/stripeCore';
import { supabaseStatus } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET /api/health — which server settings are present (yes/no only; never a value or part of one).
// Lets the owner check a deployment's configuration without opening the hosting dashboard.
export async function GET() {
  const key = checkTestSecretKey(normalizeSecretKey(process.env.STRIPE_SECRET_KEY));
  const supabase = supabaseStatus();
  return json({
    ok: true,
    database: 'supabase',
    supabase, // { url: boolean, anonKey: 'ready'|'missing'|'wrong-kind', serviceKey: 'ready'|'missing'|'wrong-kind' }
    sessions: Boolean(process.env.JWT_SECRET),
    payments: key.ok ? 'ready' : key.reason, // 'ready' | 'missing' | 'live' | 'malformed'
    webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
  });
}
