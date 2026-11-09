// Shared commerce helpers for the catalog, details dialog, basket drawer and packages:
// pricing text, request state of a service, and the primary / add buttons (one behaviour everywhere).
import { CalendarCheck, Check, FileText, Plus } from 'lucide-react';
import type { Lang, PackageId, Pricing, Service, ServiceId } from '../../data/types';
import { getPackage } from '../../data/packages';
import { formatNumber, useI18n } from '../../i18n';
import { packageCovers, useBasket } from '../../state/basket';
import { addServiceToRequest, runPrimaryAction } from '../../state/actions';
import { useUI } from '../../state/ui';

/** 21st.dev-style pointer spotlight: writes --mx/--my on the card (CSS paints the light; no React state). */
export function trackSpotlight(event: { currentTarget: HTMLElement; clientX: number; clientY: number }): void {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  el.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

/**
 * "$49" in both languages, the same rule as formatAmount in src/lib/requests.ts: the Arabic ICU pattern ("49 US$")
 * reorders to "$US 49" inside RTL text, whereas "$49" stays one unit under the bidi rules.
 */
export function formatPrice(amount: number, currency: string, lang: Lang): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${formatNumber(amount, lang)}`;
  }
}

export interface PricingText {
  kind: Pricing['kind'];
  /** Short label: "Quote-based" or "$39 per session". */
  short: string;
  /** Full label: "Quote-based" or "Illustrative classwork price · $39 per session". */
  label: string;
  /** Honest explanatory note. */
  note: string;
}

export function usePricingText(pricing: Pricing): PricingText {
  const { t, loc, lang } = useI18n();
  if (pricing.kind === 'quote') {
    // Scope-dependent pricing: never shown as a number — the visitor requests a quote.
    return { kind: 'quote', short: t('common.requestQuote'), label: t('common.requestQuote'), note: t('common.quoteNote') };
  }
  const price = t('common.priceFrom', { amount: formatPrice(pricing.amount, pricing.currency, lang), per: loc(pricing.per) });
  return {
    kind: 'illustrative',
    short: price,
    label: t('catalog.priceIllustrative', { price }),
    note: t('common.illustrativeNote'),
  };
}

export type RequestState = 'idle' | 'inRequest' | 'included';

/** Whether a service is already in the request basket, or covered by the selected package. */
export function useRequestState(id: ServiceId): { state: RequestState; packageId: PackageId | null } {
  const inBasket = useBasket((s) => s.serviceIds.includes(id));
  const packageId = useBasket((s) => s.packageId);
  if (inBasket) return { state: 'inRequest', packageId };
  if (packageCovers(packageId, id)) return { state: 'included', packageId };
  return { state: 'idle', packageId };
}

/**
 * Shows the request basket. If the basket is already open underneath the details dialog
 * (details opened from inside the basket), closing the dialog reveals it instead of stacking.
 */
export function openRequestBasket(): void {
  const ui = useUI.getState();
  if (ui.basketOpen && ui.detailsId) ui.closeDetails();
  else ui.openBasket();
}

interface ButtonProps {
  service: Service;
  className?: string;
  size?: 'sm' | 'md';
  /** Use the long "— view request" labels (details dialog). */
  verbose?: boolean;
  /** Visual weight when idle (the "done" state is always secondary). */
  variant?: 'primary' | 'secondary';
  /** Appends the service name for screen readers (many identical buttons on one page). */
  withName?: boolean;
}

function NameSuffix({ service }: { service: Service }) {
  const { t, loc } = useI18n();
  return <span className="sr-only">{t('catalog.detailsSuffix', { name: loc(service.name) })}</span>;
}

function cls(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** "Add to request" with state: "In request ✓" / "Included in <package> ✓" — both then open the basket. */
export function AddToRequestButton({
  service,
  className,
  size = 'md',
  verbose,
  quote,
  variant = 'primary',
  withName,
}: ButtonProps & { quote?: boolean }) {
  const { t, loc } = useI18n();
  const { state, packageId } = useRequestState(service.id);
  const sizeCls = size === 'sm' ? 'btn--sm' : undefined;
  if (state !== 'idle') {
    const pkg = packageId ? loc(getPackage(packageId).name) : '';
    const label =
      state === 'inRequest'
        ? verbose
          ? t('details.inRequest')
          : t('catalog.stateInRequest')
        : verbose
          ? t('details.included', { pkg })
          : t('catalog.stateIncluded', { pkg });
    return (
      <button
        type="button"
        className={cls('btn btn--secondary cat-btn-done', sizeCls, className)}
        data-state={state}
        onClick={openRequestBasket}
      >
        <Check aria-hidden="true" />
        <span>{label}</span>
        {verbose ? null : <span className="sr-only">{t('catalog.openBasketSuffix')}</span>}
      </button>
    );
  }
  const Icon = quote ? FileText : Plus;
  return (
    <button
      type="button"
      className={cls('btn', variant === 'primary' ? 'btn--primary' : 'btn--secondary', sizeCls, className)}
      onClick={() => addServiceToRequest(service.id)}
    >
      <Icon aria-hidden="true" />
      <span>{quote ? t('common.requestQuote') : t('common.addToRequest')}</span>
      {withName ? <NameSuffix service={service} /> : null}
    </button>
  );
}

/** The service's primary call to action: add / request a quote / book a (demo) consultation. */
export function PrimaryActionButton({ service, className, size = 'md', verbose, withName }: ButtonProps) {
  const { t } = useI18n();
  if (service.primaryAction === 'book') {
    return (
      <button
        type="button"
        className={cls('btn btn--primary', size === 'sm' ? 'btn--sm' : undefined, className)}
        onClick={() => runPrimaryAction(service.id)}
      >
        <CalendarCheck aria-hidden="true" />
        <span>{t('common.bookConsultation')}</span>
        {withName ? <NameSuffix service={service} /> : null}
      </button>
    );
  }
  return (
    <AddToRequestButton
      service={service}
      className={className}
      size={size}
      verbose={verbose}
      withName={withName}
      quote={service.primaryAction === 'quote'}
    />
  );
}
