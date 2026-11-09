import { getSession } from '@/lib/auth';
import { errorResponse, json } from '@/lib/http';
import { getOrderForUser } from '@/lib/orders';

// GET /api/orders/:id — one order, matched by BOTH the order id and the signed-in owner.
// Another user's order id gives 404 (it is never revealed whether that order exists).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session.ok) return json({ error: 'Please log in to see this order.', reason: session.reason }, 401);
    const { id } = await params;
    const order = await getOrderForUser(session.userId, id);
    return order ? json({ order }) : json({ error: 'Order not found.' }, 404);
  } catch (error) {
    return errorResponse(error);
  }
}
