// One service in the catalog grid: pointer-spotlight glass card with honest meta (estimate, pricing kind)
// and the service's primary action. State is always shown with icon + text, never colour alone.
import Link from 'next/link';
import { Check, Clock, Eye, ShieldCheck, Tag, UserRound } from 'lucide-react';
import type { Service } from '../../data/types';
import { categoryById } from '../../data/categories';
import { getPackage } from '../../data/packages';
import { useI18n } from '../../i18n';
import { useUI } from '../../state/ui';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { AddToRequestButton, PrimaryActionButton, trackSpotlight, usePricingText, useRequestState } from './commerce';

interface ServiceCardProps {
  service: Service;
  /** 1-based catalog index for the telemetry code ("SVC-03"). */
  index: number;
  /** Store pages: "View details" opens this product page instead of the details dialog. */
  detailsHref?: string;
}

export function ServiceCard({ service, index, detailsHref }: ServiceCardProps) {
  const { t, loc } = useI18n();
  const pricing = usePricingText(service.pricing);
  const { state, packageId } = useRequestState(service.id);
  const category = categoryById(service.category);
  const titleId = `cat-card-${service.id}`;
  const personal = service.primaryAction === 'book';

  const openDetails = () => useUI.getState().openDetails(service.id);
  const code = t('catalog.cardCode', { n: String(index).padStart(2, '0') });

  const detailsInner = (
    <>
      <Eye aria-hidden="true" />
      <span>{t('common.viewDetails')}</span>
      <span className="sr-only">{t('catalog.detailsSuffix', { name: loc(service.name) })}</span>
    </>
  );
  const detailsAction = (className: string) =>
    detailsHref ? (
      <Link className={className} href={detailsHref}>
        {detailsInner}
      </Link>
    ) : (
      <button type="button" className={className} onClick={openDetails}>
        {detailsInner}
      </button>
    );

  return (
    <article className="card cat-card" aria-labelledby={titleId} data-state={state} onPointerMove={trackSpotlight}>
      <span className="cat-card__corners" aria-hidden="true" />
      <div className="cat-card__top">
        <span className="cat-card__icon" aria-hidden="true">
          <ServiceIcon name={service.icon} />
        </span>
        <div className="cat-card__tags">
          <span className="badge">{loc(category.label)}</span>
          {state !== 'idle' ? (
            <span className="badge badge--teal cat-card__state">
              <Check aria-hidden="true" />
              {state === 'inRequest'
                ? t('catalog.stateInRequest')
                : t('catalog.stateIncluded', { pkg: packageId ? loc(getPackage(packageId).name) : '' })}
            </span>
          ) : null}
        </div>
        <span className="cat-card__code telemetry" aria-hidden="true">
          {code}
        </span>
      </div>

      <div className="cat-card__body">
        <h3 id={titleId} className="cat-card__title">
          {loc(service.name)}
        </h3>
        <p className="cat-card__benefit">{loc(service.benefit)}</p>
      </div>

      <dl className="cat-card__meta">
        <div className="cat-card__row">
          <dt>
            <UserRound aria-hidden="true" />
            <span>{t('catalog.forLabel')}</span>
          </dt>
          <dd>{loc(service.audienceText)}</dd>
        </div>
        <div className="cat-card__row cat-card__row--chips">
          <dt className="sr-only">{t('catalog.durationLabel')}</dt>
          <dd>
            <span className="cat-chip-meta" title={t('common.estimateNote')}>
              <Clock aria-hidden="true" />
              {loc(service.duration)}
            </span>
          </dd>
        </div>
        <div className="cat-card__row cat-card__row--price" data-kind={pricing.kind}>
          <dt>
            <Tag aria-hidden="true" />
            <span className="sr-only">{t('catalog.priceLabel')}</span>
          </dt>
          <dd>{pricing.label}</dd>
        </div>
      </dl>

      {service.requiresAuthorization ? (
        <p className="cat-card__auth">
          <ShieldCheck aria-hidden="true" />
          <span>{t('catalog.authNote')}</span>
        </p>
      ) : null}

      <div className={`cat-card__actions${personal ? ' cat-card__actions--personal' : ''}`}>
        {personal ? (
          <>
            <PrimaryActionButton service={service} className="cat-card__primary" withName />
            {detailsAction('btn btn--secondary btn--sm')}
            <AddToRequestButton service={service} size="sm" variant="secondary" withName />
          </>
        ) : (
          <>
            {detailsAction('btn btn--secondary')}
            <PrimaryActionButton service={service} className="cat-card__primary" withName />
          </>
        )}
      </div>
    </article>
  );
}
