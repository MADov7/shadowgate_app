import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { errorResponse, isSameOrigin, json, readJson, siteOrigin, unauthorized } from '@/lib/http';
import { startCheckout } from '@/lib/checkout';
import { validateCheckoutInput } from '@/lib/validators';

export const dynamic = 'force-dynamic';

// POST /api/checkout — { items: [{ slug, quantity }] } → { url, sessionId } (Stripe Checkout, TEST MODE).
// The server-side "function" that starts the payment (the class brief's Supabase Edge Function). Requires a valid
// session cookie (401 otherwise). Prices come from Supabase; any price, total or user id in the body is ignored.
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return json({ error: 'Cross-site requests are not allowed.' }, 403);
    const session = await getSession();
    if (!session.ok) return unauthorized(session.reason);
    const result = validateCheckoutInput(await readJson(request));
    if (!result.ok) return json({ error: 'The cart is not valid.', fields: result.errors }, 400);
    return json(await startCheckout(session.userId, result.data, siteOrigin(request)), 201);
  } catch (error) {
    return errorResponse(error);
  }
}
