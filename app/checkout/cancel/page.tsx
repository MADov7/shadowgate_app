import type { Metadata } from 'next';
import { CheckoutCancelEntry } from '@/components/shop/entries';
import { getSessionUser } from '@/lib/auth';
import { getProductsOrEmpty } from '@/lib/catalog';

export const metadata: Metadata = { title: 'Payment cancelled — SHADOW GATE', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

// Stripe's cancel_url. Nothing was charged and no order exists for an unpaid session.
export default async function CheckoutCancelPage() {
  const [{ products }, sessionUser] = await Promise.all([getProductsOrEmpty(), getSessionUser()]);
  return <CheckoutCancelEntry products={products} sessionUser={sessionUser} />;
}
