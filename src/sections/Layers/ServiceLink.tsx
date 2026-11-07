// Linked-service row shared by the guidance sections (layers, simulation, quiz):
// icon + name (+ benefit) with "View details" and the service's primary action (add / book).
import { Check, Info, Plus, CalendarCheck } from 'lucide-react';
import type { ServiceId } from '../../data/types';
import { getService } from '../../data/services';
import { useI18n } from '../../i18n';
import { packageCovers, useBasket } from '../../state/basket';
import { runPrimaryAction } from '../../state/actions';
import { useUI } from '../../state/ui';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import './ServiceLink.css';

/** True when the service is in the request basket or covered by the selected package. */
export function useInRequest(id: ServiceId): boolean {
  return useBasket((s) => s.serviceIds.includes(id) || packageCovers(s.packageId, id));
}

export function ServiceActions({ id, size = 'sm' }: { id: ServiceId; size?: 'sm' | 'md' }) {
  const { t, loc } = useI18n();
  const service = getService(id);
  const inRequest = useInRequest(id);
  const isBook = service.primaryAction === 'book';
  const sizeClass = size === 'sm' ? ' btn--sm' : '';
  const name = loc(service.name);
  return (
    <div className="guide-actions">
      <button
        type="button"
        className={`btn btn--ghost${sizeClass}`}
        onClick={() => useUI.getState().openDetails(id)}
      >
        <Info aria-hidden="true" />
        {t('common.viewDetails')}
        <span className="sr-only">: {name}</span>
      </button>
      <button
        type="button"
        className={`btn${sizeClass} ${inRequest && !isBook ? 'btn--secondary guide-actions__in' : 'btn--primary'}`}
        onClick={() => runPrimaryAction(id)}
      >
        {isBook ? <CalendarCheck aria-hidden="true" /> : inRequest ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
        {isBook ? t('common.bookConsultation') : inRequest ? t('common.inRequest') : t('common.addToRequest')}
        <span className="sr-only">: {name}</span>
      </button>
    </div>
  );
}

interface ServiceLinkProps {
  id: ServiceId;
  /** Small telemetry label above the name (e.g. "Linked service"). */
  label?: string;
  /** Hide the one-line benefit (compact layouts). */
  compact?: boolean;
  className?: string;
}

export function ServiceLink({ id, label, compact, className }: ServiceLinkProps) {
  const { loc } = useI18n();
  const service = getService(id);
  const benefit = loc(service.benefit);
  return (
    <div className={`guide-svc${compact ? ' guide-svc--compact' : ''}${className ? ` ${className}` : ''}`}>
      <span className="guide-svc__icon" aria-hidden="true">
        <ServiceIcon name={service.icon} />
      </span>
      <div className="guide-svc__text">
        {label && <span className="guide-svc__label">{label}</span>}
        <span className="guide-svc__name">{loc(service.name)}</span>
        {!compact && benefit && <span className="guide-svc__benefit">{benefit}</span>}
      </div>
      <ServiceActions id={id} />
    </div>
  );
}
