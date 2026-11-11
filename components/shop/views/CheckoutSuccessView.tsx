// /checkout/success — Stripe sends the visitor back here after paying. Without reloading the page, it asks the
// server (POST /api/checkout/confirm) to re-check the session WITH STRIPE; once Stripe says "paid", the server saves
// the order in Supabase with status "paid" and this view shows "Payment successful ✓", then removes the paid
// services from the cart. If Stripe is still confirming, it checks again by itself a few times.
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Loader2, ShoppingBag } from 'lucide-react';
import type { PublicOrder } from '@/src/data/orderTypes';
import type { Service } from '@/src/data/types';
import { useI18n } from '@/src/i18n';
import { useBasket } from '@/src/state/basket';
import { isServiceId } from '@/src/data/services';
import { formatPrice } from '@/src/sections/Catalog/commerce';
import { ShopShell } from '../ShopShell';
import { orderCode } from '../orderFormat';

type View =
  | { kind: 'checking' }
  | { kind: 'paid'; order: PublicOrder }
  | { kind: 'processing' }
  | { kind: 'open' }
  | { kind: 'expired' }
  | { kind: 'invalid' }
  | { kind: 'login' }
  | { kind: 'error'; reason: string };

const MAX_AUTO_CHECKS = 8;
const RECHECK_MS = 2500;

export default function CheckoutSuccessView({ sessionId }: { products: Service[]; sessionId: string | null }) {
  const { t, lang } = useI18n();
  const [view, setView] = useState<View>(sessionId ? { kind: 'checking' } : { kind: 'invalid' });
  const attempts = useRef(0);
  const cleared = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);

  const confirm = useCallback(async (signal?: AbortSignal) => {
    if (!sessionId) return;
    attempts.current += 1;
    try {
      const res = await fetch('/api/checkout/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ sessionId }),
        signal,
      });
      const data = (await res.json().catch(() => ({}))) as { status?: string; order?: PublicOrder; error?: string };
      if (signal?.aborted) return;
      if (res.status === 401) return setView({ kind: 'login' });
      if (res.status === 404 || res.status === 400) return setView({ kind: 'invalid' });
      if (!res.ok) return setView({ kind: 'error', reason: data.error ?? t('pay.payUnavailable') });
      if (data.status === 'paid' && data.order) return setView({ kind: 'paid', order: data.order });
      if (data.status === 'expired') return setView({ kind: 'expired' });
      if (data.status === 'open') return setView({ kind: 'open' });
      setView({ kind: 'processing' });
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return;
      setView({ kind: 'error', reason: t('pay.payNetwork') });
    }
  }, [sessionId, t]);

  // First check on load (no reload needed), then automatic re-checks while Stripe is still confirming.
  useEffect(() => {
    const ctrl = new AbortController();
    void confirm(ctrl.signal);
    return () => ctrl.abort();
  }, [confirm]);

  useEffect(() => {
    if (view.kind !== 'processing' || attempts.current >= MAX_AUTO_CHECKS) return;
    const timer = window.setTimeout(() => void confirm(), RECHECK_MS);
    return () => window.clearTimeout(timer);
  }, [view, confirm]);

  // Paid: remove exactly the paid services from the saved cart (quote-based ones stay for the request form).
  useEffect(() => {
    if (view.kind !== 'paid' || cleared.current) return;
    cleared.current = true;
    const basket = useBasket.getState();
    for (const item of view.order.items) if (isServiceId(item.slug)) basket.remove(item.slug);
  }, [view]);

  // Move focus to the result so screen readers announce it.
  useEffect(() => {
    if (view.kind !== 'checking') heading.current?.focus();
  }, [view.kind]);

  const retry = () => {
    attempts.current = 0;
    setView({ kind: 'checking' });
    void confirm();
  };

  let icon = <Loader2 className="pay-result__spin" aria-hidden="true" />;
  let tone: 'ok' | 'wait' | 'warn' = 'wait';
  let title = t('pay.checking');
  let body: string | null = null;
  if (view.kind === 'paid') {
    icon = <CheckCircle2 aria-hidden="true" />;
    tone = 'ok';
    title = t('pay.paidTitle');
    body = t('pay.paidBody', { id: orderCode(view.order.id) });
  } else if (view.kind === 'processing') {
    icon = <Clock3 aria-hidden="true" />;
    title = t('pay.processingTitle');
    body = t('pay.processingBody');
  } else if (view.kind !== 'checking') {
    icon = <AlertTriangle aria-hidden="true" />;
    tone = 'warn';
    const map = {
      open: ['pay.openTitle', 'pay.openBody'],
      expired: ['pay.expiredTitle', 'pay.expiredBody'],
      invalid: ['pay.invalidTitle', 'pay.invalidBody'],
      login: ['pay.errorTitle', 'pay.paySessionExpired'],
      error: ['pay.errorTitle', 'pay.errorBody'],
    } as const;
    const [tk, bk] = map[view.kind];
    title = t(tk);
    body = t(bk, view.kind === 'error' ? { reason: view.reason } : undefined);
  }

  return (
    <ShopShell active="cart" title={t('pay.successPageTitle')}>
      <div className="container shop-page">
        <section className="panel pay-result" data-state={view.kind} data-tone={tone} aria-labelledby="pay-result-title">
          <span className="eyebrow">{t('pay.successEyebrow')}</span>
          <div className="pay-result__icon" aria-hidden="true">
            {icon}
          </div>
          <div aria-live="polite" aria-atomic="true" className="pay-result__live">
            <h1 id="pay-result-title" className="pay-result__title" ref={heading} tabIndex={-1}>
              {title}
            </h1>
            {body ? <p className="pay-result__body">{body}</p> : null}
          </div>

          {view.kind === 'paid' ? (
            <>
              <dl className="shop-sum pay-result__sum">
                <div className="shop-sum__total">
                  <dt>{t('pay.paidAmount')}</dt>
                  <dd>{formatPrice(view.order.total, 'USD', lang)}</dd>
                </div>
              </dl>
              <p className="pay-result__note">
                <span className="badge pay-test-badge">{t('pay.testBadge')}</span> {t('pay.paidTestNote')}
              </p>
              <p className="pay-result__note">{t('pay.paidCartNote')}</p>
              <div className="pay-result__actions">
                <Link className="btn btn--primary" href={`/orders/${view.order.id}`}>
                  {t('pay.viewOrder')}
                  <ArrowRight className="icon-flip" aria-hidden="true" />
                </Link>
                <Link className="btn btn--secondary" href="/orders">
                  {t('pay.myOrders')}
                </Link>
                <Link className="btn btn--ghost" href="/products">
                  {t('pay.keepBrowsing')}
                </Link>
              </div>
            </>
          ) : view.kind === 'checking' ? null : (
            <div className="pay-result__actions">
              {view.kind === 'login' ? (
                <Link className="btn btn--primary" href={`/login?next=${encodeURIComponent(`/checkout/success?session_id=${sessionId ?? ''}`)}`}>
                  {t('pay.loginAgain')}
                </Link>
              ) : null}
              {view.kind === 'processing' || view.kind === 'error' ? (
                <button type="button" className="btn btn--primary" onClick={retry}>
                  {t('pay.checkAgain')}
                </button>
              ) : null}
              <Link className="btn btn--secondary" href="/cart">
                <ShoppingBag aria-hidden="true" />
                {t('pay.backToCart')}
              </Link>
            </div>
          )}
        </section>
      </div>
    </ShopShell>
  );
}
