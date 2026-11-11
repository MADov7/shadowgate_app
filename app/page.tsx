import ExperienceClient from '@/components/ExperienceClient';
import { getSessionUser } from '@/lib/auth';
import { getProductsOrEmpty } from '@/lib/catalog';
import DbNotice from '@/components/shop/DbNotice';

// Always read fresh products from Supabase (an edit in the Supabase table shows up on the next refresh).
export const dynamic = 'force-dynamic';

// Home: the existing cinematic Shadow Gate experience (welcome gate, scroll-driven 3D world, featured services,
// catalog, forms) — with the products loaded from the database and the signed-in user from the session cookie.
export default async function HomePage() {
  const [{ products, dbError }, sessionUser] = await Promise.all([getProductsOrEmpty(), getSessionUser()]);
  return (
    <>
      <ExperienceClient products={products} sessionUser={sessionUser} />
      {dbError ? <DbNotice /> : null}
    </>
  );
}
