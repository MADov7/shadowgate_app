import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OrdersEntry } from '@/components/shop/entries';
import { getSession } from '@/lib/auth';
import { getProducts } from '@/lib/catalog';
import { listOrdersForUser } from '@/lib/orders';

export const metadata: Metadata = { title: 'My Orders — SHADOW GATE' };
export const dynamic = 'force-dynamic';

// PROTECTED: checked on the server before anything is rendered. No valid token (missing, invalid or expired) →
// redirect to Log In with the reason. The orders query uses only the user id from the verified token.
export default async function OrdersPage() {
  const session = await getSession();
  if (!session.ok) redirect(`/login?next=/orders&reason=${session.reason === 'missing' ? 'required' : session.reason}`);
  const [products, orders] = await Promise.all([getProducts(), listOrdersForUser(session.userId)]);
  return <OrdersEntry products={products} orders={orders} sessionUser={{ id: session.userId, name: session.name }} />;
}
