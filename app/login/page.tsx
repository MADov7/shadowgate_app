import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginEntry } from '@/components/shop/entries';
import { safeNext } from '@/lib/safeNext';
import type { LoginNotice } from '@/components/shop/views/LoginView';
import { getSessionUser } from '@/lib/auth';
import { getProductsOrEmpty } from '@/lib/catalog';
import DbNotice from '@/components/shop/DbNotice';

export const metadata: Metadata = { title: 'Log in — SHADOW GATE' };
export const dynamic = 'force-dynamic';

const NOTICES = new Set(['expired', 'invalid', 'required']);

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSessionUser()) redirect(next);
  const notice: LoginNotice = params.registered ? 'registered' : NOTICES.has(params.reason ?? '') ? (params.reason as LoginNotice) : null;
  // The form works without the catalog; if the database is down the page still opens and the API answers 503.
  const { products, dbError } = await getProductsOrEmpty();
  return (
    <>
      <LoginEntry products={products} sessionUser={null} next={next} notice={notice} email="" />
      {dbError ? <DbNotice /> : null}
    </>
  );
}
