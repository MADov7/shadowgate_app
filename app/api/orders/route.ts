import { getSession } from '@/lib/auth';
import { errorResponse, json, readJson } from '@/lib/http';
import { createOrderForUser, listOrdersForUser } from '@/lib/orders';
import { validateOrderInput } from '@/lib/validators';

const UNAUTHORIZED = {
  missing: 'Please log in to see your orders.',
  invalid: 'Your session is not valid. Please log in again.',
  expired: 'Your session has expired. Please log in again.',
} as const;

// GET /api/orders — the signed-in user's orders only (401 without a valid token).
export async function GET() {
  try {
    const session = await getSession();
    if (!session.ok) return json({ error: UNAUTHORIZED[session.reason], reason: session.reason }, 401);
    return json({ orders: await listOrdersForUser(session.userId) });
  } catch (error) {
    return errorResponse(error);
  }
}

// POST /api/orders — { items: [{ slug, quantity }], packageSlug?, requestType?, organisation?, phone?, message? }
// Creates a pending order for the user in the token. Any user id in the body is ignored; prices come from the DB.
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session.ok) return json({ error: UNAUTHORIZED[session.reason], reason: session.reason }, 401);
    const result = validateOrderInput(await readJson(request));
    if (!result.ok) return json({ error: 'The order is not valid.', fields: result.errors }, 400);
    const order = await createOrderForUser(session.userId, result.data);
    return json({ order }, 201);
  } catch (error) {
    return errorResponse(error);
  }
}
