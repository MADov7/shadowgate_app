import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { SignupEntry } from '@/components/shop/entries';
import { safeNext } from '@/lib/safeNext';
import { getSessionUser } from '@/lib/auth';
import { getProductsOrEmpty } from '@/lib/catalog';
import DbNotice from '@/components/shop/DbNotice';

export const metadata: Metadata = { title: 'Sign up — SHADOW GATE' };
export const dynamic = 'force-dynamic';

export default async function SignupPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSessionUser()) redirect(next);
  // The form works without the catalog; if the database is down the page still opens and the API answers 503.
  const { products, dbError } = await getProductsOrEmpty();
  return (
    <>
      <SignupEntry products={products} sessionUser={null} next={next} />
      {dbError ? <DbNotice /> : null}
    </>
  );
}
