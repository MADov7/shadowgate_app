// Small shared pieces for the constellation section (cinematic + static).
import { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Plus } from 'lucide-react';
import type { Service, ServiceId } from '../../data/types';
import { getService } from '../../data/services';
import { useI18n, type TKey, type TVars } from '../../i18n';
import { packageCovers, useBasket } from '../../state/basket';
import { runPrimaryAction } from '../../state/actions';
import { useUI } from '../../state/ui';
import { scheduleRefresh } from '../../lib/smoothScroll';

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** matchMedia as React state (re-measures scroll triggers when it flips). */
export function useMedia(query: string): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => {
      setMatches(mq.matches);
      scheduleRefresh();
    };
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

export function pricingLabel(service: Service, t: (key: TKey, vars?: TVars) => string, lang: 'en' | 'ar'): string {
  if (service.pricing.kind === 'quote') return t('common.quoteBased');
  return `${t('common.illustrativePrice')} · $${service.pricing.amount} ${service.pricing.per[lang]}`;
}

/** "View details" + the service's primary action, with basket-aware state. */
export function ServiceActions({ id, compact = false }: { id: ServiceId; compact?: boolean }) {
  const { t, loc } = useI18n();
  const service = getService(id);
  const inBasket = useBasket((s) => s.serviceIds.includes(id));
  const covered = useBasket((s) => packageCovers(s.packageId, id));
  const done = inBasket || covered;
  const label = covered
    ? t('constellation.includedInPackage')
    : inBasket
      ? t('common.inRequest')
      : service.primaryAction === 'quote'
        ? t('common.requestQuote')
        : t('common.addToRequest');
  const size = compact ? ' btn--sm' : '';
  const name = loc(service.name);
  return (
    <div className="cst-actions">
      <button type="button" className={`btn btn--secondary${size}`} onClick={() => useUI.getState().openDetails(id)}>
        {t('common.viewDetails')}
        <span className="sr-only">: {name}</span>
      </button>
      <button
        type="button"
        className={`btn ${done ? 'btn--secondary cst-done' : 'btn--primary'}${size}`}
        onClick={() => runPrimaryAction(id)}
      >
        {done ? <Check aria-hidden="true" /> : service.primaryAction === 'quote' ? <ArrowUpRight aria-hidden="true" className="icon-flip" /> : <Plus aria-hidden="true" />}
        {label}
        <span className="sr-only">: {name}</span>
      </button>
    </div>
  );
}
