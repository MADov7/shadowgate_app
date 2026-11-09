// /checkout/cancel — the visitor left Stripe Checkout without paying. Nothing was charged and no order was saved
// (orders are written only after Stripe confirms a payment); the cart is still saved in this browser.
import Link from 'next/link';
import { ArrowRight, ShoppingBag, XCircle } from 'lucide-react';
import type { Service } from '@/src/data/types';
import { useI18n } from '@/src/i18n';
import { ShopShell } from '../ShopShell';

export default function CheckoutCancelView(_props: { products: Service[] }) {
  const { t } = useI18n();
  return (
    <ShopShell active="cart" title={t('pay.cancelTitle')}>
      <div className="container shop-page">
        <section className="panel pay-result" data-state="cancelled" data-tone="warn" aria-labelledby="pay-cancel-title">
          <span className="eyebrow">{t('pay.successEyebrow')}</span>
          <div className="pay-result__icon" aria-hidden="true">
            <XCircle />
          </div>
          <h1 id="pay-cancel-title" className="pay-result__title">
            {t('pay.cancelTitle')}
          </h1>
          <p className="pay-result__body">{t('pay.cancelBody')}</p>
          <div className="pay-result__actions">
            <Link className="btn btn--primary" href="/cart">
              <ShoppingBag aria-hidden="true" />
              {t('pay.backToCart')}
            </Link>
            <Link className="btn btn--ghost" href="/products">
              {t('pay.keepBrowsing')}
              <ArrowRight className="icon-flip" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </ShopShell>
  );
}
