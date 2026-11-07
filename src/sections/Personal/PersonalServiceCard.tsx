// Card for one personal service: benefit, who it is for, estimated duration, an ILLUSTRATIVE classwork price,
// and three actions (book a demo consultation, add to request, view details). Pointer spotlight via --mx/--my.
import type { PointerEvent } from 'react';
import { CalendarPlus, Check, Clock, Info, Plus, UserRound } from 'lucide-react';
import { useI18n } from '../../i18n';
import type { Service } from '../../data/types';
import { useBasket } from '../../state/basket';
import { useUI } from '../../state/ui';
import { addServiceToRequest } from '../../state/actions';
import { illustrativeParts } from '../../lib/requests';
import { ServiceIcon } from '../../components/ui/ServiceIcon';

function spotlight(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
  el.style.setProperty('--my', `${event.clientY - rect.top}px`);
}

interface Props {
  service: Service;
  index: number;
  total: number;
}

export function PersonalServiceCard({ service, index, total }: Props) {
  const { t, loc, lang } = useI18n();
  const inRequest = useBasket((s) => s.serviceIds.includes(service.id));
  const name = loc(service.name);
  const price = illustrativeParts(service.pricing, lang);
  const titleId = `per-${service.id}-name`;

  return (
    <article className="card per-card" aria-labelledby={titleId} onPointerMove={spotlight}>
      <div className="per-card__top">
        <span className="per-card__icon" aria-hidden="true">
          <ServiceIcon name={service.icon} />
        </span>
        <span className="telemetry per-card__count" aria-hidden="true">
          {t('personal.counter', { index: String(index).padStart(2, '0'), total: String(total).padStart(2, '0') })}
        </span>
      </div>

      <div className="per-card__head">
        <h3 id={titleId} className="per-card__name">
          {name}
        </h3>
        <p className="per-card__benefit">{loc(service.benefit)}</p>
      </div>

      <dl className="per-card__facts">
        <div>
          <dt>
            <UserRound aria-hidden="true" />
            {t('common.audienceLabel')}
          </dt>
          <dd>{loc(service.audienceText)}</dd>
        </div>
        <div>
          <dt>
            <Clock aria-hidden="true" />
            {t('common.estimatedDuration')}
          </dt>
          <dd>{loc(service.duration)}</dd>
        </div>
      </dl>

      <div className="per-card__price">
        {price ? (
          <p className="per-card__price-line">
            <span className="per-card__price-label">{t('personal.priceLabel')}</span>
            <span className="per-card__price-sep" aria-hidden="true">
              ·
            </span>
            <span className="per-card__amount">{price.amount}</span> <span className="per-card__per">{price.per}</span>
          </p>
        ) : (
          <p className="per-card__price-line">
            <span className="per-card__amount per-card__amount--quote">{t('common.quoteBased')}</span>
          </p>
        )}
        <p className="per-card__price-note">{price ? t('common.illustrativeNote') : t('common.quoteNote')}</p>
      </div>

      <div className="per-card__actions">
        <button
          type="button"
          className="btn btn--primary per-card__book"
          aria-label={t('personal.bookFor', { name })}
          onClick={() => useUI.getState().openBooking(service.id)}
        >
          <CalendarPlus aria-hidden="true" />
          {t('common.bookConsultation')}
        </button>
        <div className="per-card__secondary">
          <button
            type="button"
            className="btn btn--secondary"
            data-in-request={inRequest || undefined}
            aria-label={inRequest ? t('personal.inRequestFor', { name }) : t('personal.addFor', { name })}
            onClick={() => addServiceToRequest(service.id)}
          >
            {inRequest ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {inRequest ? t('common.inRequest') : t('common.addToRequest')}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            aria-label={t('personal.detailsFor', { name })}
            onClick={() => useUI.getState().openDetails(service.id)}
          >
            <Info aria-hidden="true" />
            {t('common.viewDetails')}
          </button>
        </div>
      </div>
    </article>
  );
}
