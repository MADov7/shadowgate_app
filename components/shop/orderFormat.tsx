// Display helpers for orders (shared by My Orders and the order details page).
import Link from 'next/link';
import { CheckCircle2, Clock3 } from 'lucide-react';
import type { PublicOrder } from '@/src/data/orderTypes';
import { getPackage, isPackageId } from '@/src/data/packages';
import { formatNumber, useI18n } from '@/src/i18n';
import { formatPrice } from '@/src/sections/Catalog/commerce';

export function orderCode(id: string): string {
  return `SG-${id.slice(-6).toUpperCase()}`;
}

export function useOrderDate() {
  const { lang } = useI18n();
  return (iso: string | null) =>
    iso
      ? new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
      : '—';
}

export function StatusBadge({ status }: { status: PublicOrder['status'] }) {
  const { t } = useI18n();
  return (
    <span className={`badge ${status === 'paid' ? 'badge--teal' : 'order-status--pending'}`} data-status={status}>
      {status === 'paid' ? <CheckCircle2 aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
      {status === 'paid' ? t('auth.statusPaid') : t('auth.statusPending')}
    </span>
  );
}

export function OrderItems({ order }: { order: PublicOrder }) {
  const { t, lang } = useI18n();
  return (
    <ul className="order-items">
      {order.items.map((item) => (
        <li key={item.slug} className="order-item">
          <Link className="order-item__name" href={`/products/${item.slug}`}>
            {(lang === 'ar' && item.name.ar) || item.name.en}
          </Link>
          <span className="order-item__qty">{t('auth.orderQty', { qty: formatNumber(item.quantity, lang) })}</span>
          <span className="order-item__price" data-kind={item.pricingKind}>
            {item.pricingKind === 'illustrative'
              ? `${formatPrice(item.price * item.quantity, 'USD', lang)} · ${t('auth.orderUnit', { price: formatPrice(item.price, 'USD', lang) })}`
              : t('auth.orderQuote')}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }: { order: PublicOrder }) {
  const { t, loc, lang } = useI18n();
  const pkg = order.packageSlug && isPackageId(order.packageSlug) ? getPackage(order.packageSlug) : null;
  return (
    <div className="order-totals">
      {pkg ? <p className="order-totals__pkg">{t('auth.orderPackage', { name: loc(pkg.name) })}</p> : null}
      {order.total > 0 ? (
        <p className="order-totals__sum">
          <span>{t('auth.orderTotal')}</span>
          <strong>{formatPrice(order.total, 'USD', lang)}</strong>
        </p>
      ) : null}
      {order.hasQuoteItems ? <p className="order-totals__note">{t('auth.orderQuoteNote')}</p> : null}
    </div>
  );
}
