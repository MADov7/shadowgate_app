import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductDetailsEntry } from '@/components/shop/entries';
import DbNotice from '@/components/shop/DbNotice';
import { getSessionUser } from '@/lib/auth';
import { getProductsOrEmpty } from '@/lib/catalog';

type Params = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { products } = await getProductsOrEmpty();
  const product = products.find((p) => p.id === slug);
  if (!product) return { title: 'SHADOW GATE' };
  return {
    title: `${product.name.en} — SHADOW GATE`,
    description: product.benefit.en,
    openGraph: { images: product.image ? [product.image] : [] },
  };
}

export default async function ProductDetailsPage({ params }: Params) {
  const { slug } = await params;
  const [{ products, dbError }, sessionUser] = await Promise.all([getProductsOrEmpty(), getSessionUser()]);
  if (dbError) {
    // Database not reachable: an honest notice instead of an error page (never a hardcoded product).
    return (
      <main className="grid min-h-screen place-items-center bg-sg-navy px-4">
        <div className="panel grid max-w-lg gap-3 p-8 text-center">
          <p className="eyebrow">SG//STORE</p>
          <h1 className="h2">Product details · تفاصيل المنتج</h1>
          <p className="text-sg-muted">This page loads the product from the store database.</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link className="btn btn--secondary" href="/">
              Home · الرئيسية
            </Link>
          </div>
        </div>
        <DbNotice />
      </main>
    );
  }
  const product = products.find((p) => p.id === slug);
  if (!product) notFound();
  return <ProductDetailsEntry products={products} product={product} sessionUser={sessionUser} />;
}
