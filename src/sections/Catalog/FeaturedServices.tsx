// FEATURED SERVICES — the Home page's highlighted products (services flagged `featured` in the catalog data).
// Each card links to its product details page and keeps the service's normal primary action.
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Service } from '../../data/types';
import { SERVICES } from '../../data/services';
import { useI18n } from '../../i18n';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { PrimaryActionButton, trackSpotlight, usePricingText } from './commerce';

function FeaturedCard({ service, href }: { service: Service; href: string }) {
  const { t, loc } = useI18n();
  const pricing = usePricingText(service.pricing);
  const titleId = `cat-feat-${service.id}`;
  return (
    <article className="card cat-feat__card" aria-labelledby={titleId} onPointerMove={trackSpotlight}>
      <div className="cat-feat__top">
        <span className="cat-card__icon" aria-hidden="true">
          <ServiceIcon name={service.icon} />
        </span>
        <span className="badge badge--teal">
          {t(service.audience === 'business' ? 'details.audienceBusiness' : 'details.audiencePersonal')}
        </span>
      </div>
      <h3 id={titleId} className="cat-feat__title">
        <Link href={href}>{loc(service.name)}</Link>
      </h3>
      <p className="cat-feat__benefit">{loc(service.benefit)}</p>
      <p className="cat-feat__price" data-kind={pricing.kind}>
        {pricing.short}
      </p>
      <div className="cat-feat__actions">
        <Link className="btn btn--secondary btn--sm" href={href}>
          {t('shop.featuredViewDetails')}
          <ArrowRight className="icon-flip" aria-hidden="true" />
          <span className="sr-only">{t('catalog.detailsSuffix', { name: loc(service.name) })}</span>
        </Link>
        <PrimaryActionButton service={service} size="sm" withName />
      </div>
    </article>
  );
}

export function FeaturedServices({ detailsHref }: { detailsHref: (id: Service['id']) => string }) {
  const { t } = useI18n();
  const featured = SERVICES.filter((s) => s.featured);
  if (featured.length === 0) return null;
  return (
    <section className="cat-feat" aria-labelledby="cat-feat-title">
      <div className="cat-feat__head">
        <span className="eyebrow">{t('shop.featuredEyebrow')}</span>
        <h3 id="cat-feat-title" className="cat-feat__heading">
          {t('shop.featuredTitle')}
        </h3>
      </div>
      <ul className="cat-feat__grid">
        {featured.map((service) => (
          <li key={service.id}>
            <FeaturedCard service={service} href={detailsHref(service.id)} />
          </li>
        ))}
      </ul>
    </section>
  );
}
