// /products/[slug] — one product (service) page: the same details content as the home page's dialog
// (scope, exclusions, deliverables, estimate, honest pricing, authorization note) plus cart actions.
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import type { Service } from '@/src/data/types';
import { useI18n } from '@/src/i18n';
import { ServiceDetailsContent } from '@/src/overlays/ServiceDetailsDialog';
import '@/src/overlays/ServiceDetailsDialog.css';
import { ShopShell } from '../ShopShell';

export default function ProductDetailsView({ product }: { products: Service[]; product: Service }) {
  const { t, loc } = useI18n();
  return (
    <ShopShell active="products" title={loc(product.name)}>
      <div className="container shop-page">
        <nav className="shop-crumbs" aria-label={t('shop.breadcrumbLabel')}>
          <ol>
            <li>
              <Link href="/products">{t('shop.breadcrumbProducts')}</Link>
            </li>
            <li aria-current="page">{loc(product.name)}</li>
          </ol>
        </nav>
        <article className="panel shop-details" aria-labelledby="details-title">
          <ServiceDetailsContent
            service={product}
            asPage
            footerExtra={
              <Link className="btn btn--ghost" href="/cart">
                <ShoppingBag aria-hidden="true" />
                {t('shop.detailsGoCart')}
              </Link>
            }
          />
        </article>
        <p className="shop-back">
          <Link className="btn btn--link" href="/products">
            {t('shop.detailsBack')}
          </Link>
        </p>
      </div>
    </ShopShell>
  );
}
