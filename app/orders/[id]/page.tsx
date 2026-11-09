import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { OrderDetailsEntry } from '@/components/shop/entries';
import { getSession } from '@/lib/auth';
import { getProducts } from '@/lib/catalog';
import { getOrderForUser } from '@/lib/orders';

export const metadata: Metadata = { title: 'Order — SHADOW GATE' };
export const dynamic = 'force-dynamic';

// PROTECTED. The order is looked up by BOTH its id and the signed-in owner, so another account's order id → 404.
export default async function OrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.ok) redirect(`/login?next=${encodeURIComponent(`/orders/${id}`)}&reason=${session.reason === 'missing' ? 'required' : session.reason}`);
  const order = await getOrderForUser(session.userId, id);
  if (!order) notFound();
  const products = await getProducts();
  return <OrderDetailsEntry products={products} order={order} sessionUser={{ id: session.userId, name: session.name }} />;
}
