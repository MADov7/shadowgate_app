// /orders/[id] — one order. The server loaded it with BOTH the order id and the signed-in owner (lib/orders.ts),
// so another account's order id shows "not found" here.
import Link from 'next/link';
import type { PublicOrder } from '@/src/data/orderTypes';
import type { Service } from '@/src/data/types';
import { useI18n } from '@/src/i18n';
import { ShopShell } from '../ShopShell';
import { OrderItems, OrderTotals, StatusBadge, orderCode, useOrderDate } from '../orderFormat';

export default function OrderDetailsView({ order }: { products: Service[]; order: PublicOrder }) {
  const { t } = useI18n();
  const fmtDate = useOrderDate();
  return (
    <ShopShell active="orders" title={orderCode(order.id)}>
      <div className="container shop-page">
        <nav className="shop-crumbs" aria-label={t('shop.breadcrumbLabel')}>
          <ol>
            <li>
              <Link href="/orders">{t('auth.myOrders')}</Link>
            </li>
            <li aria-current="page">{orderCode(order.id)}</li>
          </ol>
        </nav>
        <article className="panel order-card order-card--detail" aria-labelledby="order-detail-title">
          <header className="order-card__head">
            <div>
              <h1 id="order-detail-title" className="order-card__title">
                {t('auth.orderNumber', { id: orderCode(order.id) })}
              </h1>
              <p className="order-card__date">{t('auth.orderPlaced', { date: fmtDate(order.createdAt) })}</p>
            </div>
            <StatusBadge status={order.status} />
          </header>
          <h2 className="order-card__label">{t('auth.orderItems')}</h2>
          <OrderItems order={order} />
          <OrderTotals order={order} />
          {order.message ? (
            <>
              <h2 className="order-card__label">{t('auth.orderMessage')}</h2>
              <p className="order-card__message">{order.message}</p>
            </>
          ) : null}
        </article>
        <p className="shop-back">
          <Link className="btn btn--link" href="/orders">
            {t('auth.orderBack')}
          </Link>
        </p>
      </div>
    </ShopShell>
  );
}
