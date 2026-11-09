// /products — the full store: the existing catalog (audience switch, category chips, Arabic-aware search, result
// count, empty states), with product details as pages and the basket as the cart page.
import type { Service } from '@/src/data/types';
import { Catalog } from '@/src/sections/Catalog/Catalog';
import { useI18n } from '@/src/i18n';
import { ShopShell } from '../ShopShell';

export default function ProductsView(_props: { products: Service[] }) {
  const { t } = useI18n();
  return (
    <ShopShell active="products" title={t('shop.navProducts')}>
      <div className="shop-page shop-page--catalog">
        <Catalog titleAs="h1" detailsHref={(id) => `/products/${id}`} cartHref="/cart" />
      </div>
    </ShopShell>
  );
}
