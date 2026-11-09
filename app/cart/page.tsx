import type { Metadata } from 'next';
import { CartEntry } from '@/components/shop/entries';
import { getProductsOrEmpty } from '@/lib/catalog';
import { getSessionUser } from '@/lib/auth';
import DbNotice from '@/components/shop/DbNotice';

export const metadata: Metadata = { title: 'Cart — SHADOW GATE' };
export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const [{ products, dbError }, sessionUser] = await Promise.all([getProductsOrEmpty(), getSessionUser()]);
  return (
    <>
      <CartEntry products={products} sessionUser={sessionUser} />
      {dbError ? <DbNotice /> : null}
    </>
  );
}
