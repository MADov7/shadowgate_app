// /cart — the request basket as a full page: services with quantities, package choice, an honest summary
// (illustrative classwork prices only; scope-dependent services show "Request a quote"), clear-cart confirmation.
// The basket is the same saved store the home page uses, so the selection survives navigation and signing in.
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import type { Service, ServiceId } from '@/src/data/types';
import { getService, isServiceId } from '@/src/data/services';
import { getPackage } from '@/src/data/packages';
import { formatNumber, useI18n } from '@/src/i18n';
import { MAX_QTY, MIN_QTY, useBasket, useBasketCount } from '@/src/state/basket';
import { removeServiceFromRequest } from '@/src/state/actions';
import { useUI } from '@/src/state/ui';
import { ServiceIcon } from '@/src/components/ui/ServiceIcon';
import { formatPrice, usePricingText } from '@/src/sections/Catalog/commerce';
import { PackageSelector } from '@/src/overlays/BasketDrawer';
import '@/src/overlays/BasketDrawer.css';
import { ShopShell } from '../ShopShell';

function QtyStepper({ id, name }: { id: ServiceId; name: string }) {
  const { t } = useI18n();
  const qty = useBasket((s) => s.quantities[id] ?? MIN_QTY);
  const setQuantity = useBasket((s) => s.setQuantity);
  return (
    <div className="shop-qty" role="group" aria-label={t('shop.cartQtyLabel', { name })}>
      <button
        type="button"
        className="btn btn--ghost btn--icon btn--sm"
        onClick={() => setQuantity(id, qty - 1)}
        disabled={qty <= MIN_QTY}
        aria-label={t('shop.cartQtyDec', { name })}
      >
        <Minus aria-hidden="true" />
      </button>
      <input
        className="shop-qty__input"
        type="number"
        inputMode="numeric"
        min={MIN_QTY}
        max={MAX_QTY}
        value={qty}
        onChange={(e) => setQuantity(id, Number(e.target.value))}
        aria-label={t('shop.cartQtyLabel', { name })}
      />
      <button
        type="button"
        className="btn btn--ghost btn--icon btn--sm"
        onClick={() => setQuantity(id, qty + 1)}
        disabled={qty >= MAX_QTY}
        aria-label={t('shop.cartQtyInc', { name })}
      >
        <Plus aria-hidden="true" />
      </button>
    </div>
  );
}

function CartRow({ service }: { service: Service }) {
  const { t, loc, lang } = useI18n();
  const pricing = usePricingText(service.pricing);
  const qty = useBasket((s) => s.quantities[service.id] ?? MIN_QTY);
  const name = loc(service.name);
  const line =
    service.pricing.kind === 'illustrative'
      ? `${t('shop.cartLineTimes', { price: formatPrice(service.pricing.amount, service.pricing.currency, lang), qty: formatNumber(qty, lang) })} = ${formatPrice(service.pricing.amount * qty, service.pricing.currency, lang)}`
      : t('shop.cartLineQuote');
  return (
    <li className="shop-cart__row">
      <span className="bk-item__icon" aria-hidden="true">
        <ServiceIcon name={service.icon} />
      </span>
      <div className="shop-cart__info">
        <Link className="shop-cart__name" href={`/products/${service.id}`}>
          {name}
        </Link>
        <p className="shop-cart__price" data-kind={pricing.kind}>
          {line}
        </p>
      </div>
      <QtyStepper id={service.id} name={name} />
      <button
        type="button"
        className="btn btn--ghost btn--icon btn--sm bk-icon-btn bk-icon-btn--remove"
        onClick={() => removeServiceFromRequest(service.id)}
        aria-label={t('shop.cartRemove', { name })}
        title={t('common.remove')}
      >
        <Trash2 aria-hidden="true" />
      </button>
    </li>
  );
}

export default function CartView(_props: { products: Service[] }) {
  const { t, loc, lang } = useI18n();
  const serviceIds = useBasket((s) => s.serviceIds);
  const packageId = useBasket((s) => s.packageId);
  const quantities = useBasket((s) => s.quantities);
  const count = useBasketCount();
  const [confirming, setConfirming] = useState(false);
  const clearBtn = useRef<HTMLButtonElement>(null);

  const services = serviceIds.filter(isServiceId).map(getService);
  const units = services.reduce((n, s) => n + (quantities[s.id] ?? MIN_QTY), 0);
  const total = services.reduce(
    (sum, s) => (s.pricing.kind === 'illustrative' ? sum + s.pricing.amount * (quantities[s.id] ?? MIN_QTY) : sum),
    0,
  );
  const hasIllustrative = services.some((s) => s.pricing.kind === 'illustrative');
  const pkg = packageId ? getPackage(packageId) : null;
  const quoteLines = services.filter((s) => s.pricing.kind === 'quote').length + (pkg && pkg.pricing.kind === 'quote' ? 1 : 0);

  const clearAll = () => {
    useBasket.getState().clear();
    setConfirming(false);
    useUI.getState().toast({ tone: 'info', message: t('shop.cartCleared') });
  };

  return (
    <ShopShell active="cart" title={t('shop.cartTitle')}>
      <div className="container shop-page">
        <header className="section-head shop-head">
          <span className="eyebrow">{t('shop.cartEyebrow')}</span>
          <h1 className="h2">{t('shop.cartTitle')}</h1>
          <p className="lead">{t('shop.cartLead')}</p>
        </header>

        {count === 0 ? (
          <div className="panel shop-empty">
            <ShoppingBag aria-hidden="true" className="shop-empty__icon" />
            <h2 className="shop-empty__title">{t('shop.cartEmptyTitle')}</h2>
            <p>{t('shop.cartEmptyBody')}</p>
            <Link className="btn btn--primary" href="/products">
              {t('shop.browseAll')}
              <ArrowRight className="icon-flip" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="shop-cart">
            <div className="shop-cart__main">
              {services.length > 0 ? (
                <section className="panel shop-cart__panel" aria-labelledby="cart-items-title">
                  <h2 id="cart-items-title" className="shop-cart__heading">
                    {t('shop.cartItems')}
                  </h2>
                  <ul className="shop-cart__list">
                    {services.map((s) => (
                      <CartRow key={s.id} service={s} />
                    ))}
                  </ul>
                </section>
              ) : null}
              <section className="panel shop-cart__panel" aria-label={t('shop.cartPackage')}>
                <PackageSelector value={packageId} />
              </section>
            </div>

            <aside className="panel shop-cart__summary" aria-labelledby="cart-summary-title">
              <h2 id="cart-summary-title" className="shop-cart__heading">
                {t('shop.cartSummary')}
              </h2>
              <dl className="shop-sum">
                <div>
                  <dt>{t('shop.cartLines')}</dt>
                  <dd>{formatNumber(services.length, lang)}</dd>
                </div>
                <div>
                  <dt>{t('shop.cartUnits')}</dt>
                  <dd>{formatNumber(units, lang)}</dd>
                </div>
                <div>
                  <dt>{t('shop.cartPackage')}</dt>
                  <dd>{pkg ? loc(pkg.name) : t('shop.cartNoPackage')}</dd>
                </div>
                {hasIllustrative ? (
                  <div className="shop-sum__total">
                    <dt>{t('shop.cartIllustrativeTotal')}</dt>
                    <dd>{formatPrice(total, 'USD', lang)}</dd>
                  </div>
                ) : null}
              </dl>
              {hasIllustrative ? <p className="shop-sum__note">{t('shop.cartIllustrativeNote')}</p> : null}
              {quoteLines > 0 ? <p className="shop-sum__note">{t('shop.cartQuoteCount', { count: formatNumber(quoteLines, lang) })}</p> : null}

              <div className="shop-sum__actions">
                <Link className="btn btn--primary btn--block" href="/#contact">
                  {t('shop.cartContinue')}
                  <ArrowRight className="icon-flip" aria-hidden="true" />
                </Link>
                <Link className="btn btn--secondary btn--block" href="/products">
                  {t('shop.cartKeepBrowsing')}
                </Link>
                {confirming ? (
                  <div className="bk-confirm" role="group" aria-labelledby="cart-confirm-text">
                    <p id="cart-confirm-text" className="bk-confirm__text">
                      {t('shop.cartClearConfirm')}
                    </p>
                    <div className="bk-confirm__actions">
                      <button type="button" className="btn btn--secondary bk-danger" onClick={clearAll}>
                        <Trash2 aria-hidden="true" />
                        {t('shop.cartClearYes')}
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => {
                          setConfirming(false);
                          requestAnimationFrame(() => clearBtn.current?.focus());
                        }}
                      >
                        {t('shop.cartClearNo')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button ref={clearBtn} type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(true)}>
                    <Trash2 aria-hidden="true" />
                    {t('shop.cartClear')}
                  </button>
                )}
              </div>
              <p className="shop-sum__saved">{t('shop.cartSaved')}</p>
            </aside>
          </div>
        )}
      </div>
    </ShopShell>
  );
}
