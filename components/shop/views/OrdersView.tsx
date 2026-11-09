// /orders — protected on the server (no valid token → redirected to /login). Lists ONLY the signed-in user's
// orders (the server query is scoped to the user id in the verified token). "Refresh" re-reads GET /api/orders.
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight, PackageOpen, RefreshCw } from 'lucide-react';
import type { PublicOrder } from '@/src/data/orderTypes';
import type { Service } from '@/src/data/types';
import { formatNumber, useI18n } from '@/src/i18n';
import { useSession } from '@/src/state/session';
import { ShopShell } from '../ShopShell';
import { OrderItems, OrderTotals, StatusBadge, orderCode, useOrderDate } from '../orderFormat';

export default function OrdersView({ orders: initial }: { products: Service[]; orders: PublicOrder[] }) {
  const { t, lang } = useI18n();
  const router = useRouter();
  const fmtDate = useOrderDate();
  const [orders, setOrders] = useState(initial);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const reload = async () => {
    setState('loading');
    try {
      const res = await fetch('/api/orders', { cache: 'no-store', credentials: 'same-origin' });
      if (res.status === 401) {
        const data = (await res.json().catch(() => ({}))) as { reason?: string };
        useSession.getState().setUser(null);
        const reason = data.reason === 'expired' || data.reason === 'invalid' ? data.reason : 'required';
        router.replace(`/login?next=/orders&reason=${reason}`);
        return;
      }
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { orders: PublicOrder[] };
      setOrders(data.orders);
      setState('idle');
    } catch {
      setState('error');
    }
  };

  return (
    <ShopShell active="orders" title={t('auth.ordersTitle')}>
      <div className="container shop-page">
        <header className="section-head shop-head orders-head">
          <span className="eyebrow">{t('auth.ordersEyebrow')}</span>
          <h1 className="h2">{t('auth.ordersTitle')}</h1>
          <p className="lead">{t('auth.ordersLead')}</p>
          <div className="orders-head__bar">
            <span className="badge" aria-live="polite">{t('auth.ordersCount', { count: formatNumber(orders.length, lang) })}</span>
            <button type="button" className="btn btn--secondary btn--sm" onClick={reload} disabled={state === 'loading'}>
              <RefreshCw aria-hidden="true" className={state === 'loading' ? 'orders-spin' : undefined} />
              {state === 'loading' ? t('auth.ordersLoading') : t('auth.ordersRefresh')}
            </button>
          </div>
        </header>

        {state === 'error' ? (
          <div className="auth-alert auth-alert--error orders-error" role="alert">
            <span>{t('auth.ordersLoadError')}</span>
            <button type="button" className="btn btn--secondary btn--sm" onClick={reload}>
              {t('auth.ordersRetry')}
            </button>
          </div>
        ) : null}

        {orders.length === 0 ? (
          <div className="panel shop-empty" data-testid="orders-empty">
            <PackageOpen aria-hidden="true" className="shop-empty__icon" />
            <h2 className="shop-empty__title">{t('auth.ordersEmptyTitle')}</h2>
            <p>{t('auth.ordersEmptyBody')}</p>
            <Link className="btn btn--primary" href="/products">
              {t('auth.ordersBrowse')}
              <ArrowRight className="icon-flip" aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <ul className="orders-list" aria-busy={state === 'loading'} data-testid="orders-list">
            {orders.map((order) => (
              <li key={order.id}>
                <article className="panel order-card" aria-labelledby={`order-${order.id}`} data-order-id={order.id}>
                  <header className="order-card__head">
                    <div>
                      <h2 id={`order-${order.id}`} className="order-card__title">
                        {t('auth.orderNumber', { id: orderCode(order.id) })}
                      </h2>
                      <p className="order-card__date">{t('auth.orderPlaced', { date: fmtDate(order.createdAt) })}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </header>
                  <OrderItems order={order} />
                  <OrderTotals order={order} />
                  <p className="order-card__more">
                    <Link className="btn btn--link btn--sm" href={`/orders/${order.id}`}>
                      {t('auth.orderView')}
                      <ArrowRight className="icon-flip" aria-hidden="true" />
                    </Link>
                  </p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </ShopShell>
  );
}
