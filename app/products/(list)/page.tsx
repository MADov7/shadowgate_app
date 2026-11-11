import type { Metadata } from 'next';
import { ProductsEntry } from '@/components/shop/entries';
import { getProductsOrEmpty } from '@/lib/catalog';
import { getSessionUser } from '@/lib/auth';
import DbNotice from '@/components/shop/DbNotice';

export const metadata: Metadata = { title: 'Products — SHADOW GATE' };
// Always read fresh products from Supabase.
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [{ products, dbError }, sessionUser] = await Promise.all([getProductsOrEmpty(), getSessionUser()]);
  return (
    <>
      <ProductsEntry products={products} sessionUser={sessionUser} />
      {dbError ? <DbNotice /> : null}
    </>
  );
}
