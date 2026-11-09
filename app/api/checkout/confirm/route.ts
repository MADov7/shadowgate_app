import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth';
import { errorResponse, isSameOrigin, json, readJson, unauthorized } from '@/lib/http';
import { confirmCheckoutForUser } from '@/lib/checkout';
import { isCheckoutSessionId } from '@/lib/stripeCore';

export const dynamic = 'force-dynamic';

// POST /api/checkout/confirm — { sessionId } → { status: 'paid', order } | { status: 'processing' | 'open' | 'expired' }
// Used by /checkout/success (no page reload): the server re-reads the session FROM STRIPE, checks it belongs to the
// signed-in user (another account's session → 404) and, once paid, saves the order in MongoDB with status "paid".
export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) return json({ error: 'Cross-site requests are not allowed.' }, 403);
    const session = await getSession();
    if (!session.ok) return unauthorized(session.reason);
    const body = (await readJson(request)) as { sessionId?: unknown } | null;
    const sessionId = body?.sessionId;
    if (!isCheckoutSessionId(sessionId)) return json({ error: 'The payment session id is not valid.' }, 400);
    return json(await confirmCheckoutForUser(session.userId, sessionId));
  } catch (error) {
    return errorResponse(error);
  }
}
