import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CheckoutSuccessEntry } from '@/components/shop/entries';
import { getSession } from '@/lib/auth';
import { getProductsOrEmpty } from '@/lib/catalog';
import { isCheckoutSessionId } from '@/lib/stripeCore';

export const metadata: Metadata = { title: 'Payment — SHADOW GATE', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Stripe's success_url: /checkout/success?session_id={CHECKOUT_SESSION_ID}. PROTECTED (the order belongs to the
// signed-in account). The payment itself is confirmed by the client view through POST /api/checkout/confirm.
export default async function CheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ session_id?: string | string[] }> }) {
  const params = await searchParams;
  const raw = Array.isArray(params.session_id) ? params.session_id[0] : params.session_id;
  const sessionId = isCheckoutSessionId(raw) ? raw : null;
  const session = await getSession();
  if (!session.ok) {
    const next = `/checkout/success${sessionId ? `?session_id=${sessionId}` : ''}`;
    redirect(`/login?next=${encodeURIComponent(next)}&reason=${session.reason === 'missing' ? 'required' : session.reason}`);
  }
  const { products } = await getProductsOrEmpty();
  return <CheckoutSuccessEntry products={products} sessionId={sessionId} sessionUser={{ id: session.userId, name: session.name }} />;
}
