import { json } from '@/lib/http';
import { checkTestSecretKey } from '@/lib/stripeCore';

export const dynamic = 'force-dynamic';

// GET /api/health — which server settings are present (yes/no only; never a value or part of one).
// Lets the owner check a deployment's configuration without opening the hosting dashboard.
export async function GET() {
  const key = checkTestSecretKey(process.env.STRIPE_SECRET_KEY?.trim());
  return json({
    ok: true,
    database: Boolean(process.env.MONGODB_URI),
    sessions: Boolean(process.env.JWT_SECRET),
    payments: key.ok ? 'ready' : key.reason, // 'ready' | 'missing' | 'live' | 'malformed'
    webhook: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
  });
}
