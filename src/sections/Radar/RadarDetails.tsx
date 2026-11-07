// Details for the selected simulated event: what it means, a conceptual defensive response and the
// related Shadow Gate service. The body is a polite live region so selection changes are announced.
import { Check, Crosshair, Plus, X } from 'lucide-react';
import { useMemo } from 'react';
import { useI18n } from '../../i18n';
import { regionById } from '../../lib/geo';
import { responseForEvent, serviceForEvent } from '../../lib/threatSim';
import { getService } from '../../data/services';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { addServiceToRequest } from '../../state/actions';
import { packageCovers, useBasket } from '../../state/basket';
import { CATEGORY_COLOR_VAR, selectedEvent, useRadar, type ThreatEvent } from '../../state/radar';
import { useUI } from '../../state/ui';
import { OutcomeIcon, SeverityBars } from './RadarFeed';
import {
  CAT_ABOUT,
  CAT_DESC,
  CAT_LABEL,
  OUT_LABEL,
  OUT_NOTE,
  RESPONSE_TEXT,
  SEV_LABEL,
  SEV_LEVEL,
  formatClock,
} from './radarText';

function Details({ event }: { event: ThreatEvent }) {
  const { t, loc, lang } = useI18n();
  const region = regionById(event.from);
  const serviceId = serviceForEvent(event);
  const service = getService(serviceId);
  const inRequest = useBasket((s) => s.serviceIds.includes(serviceId) || packageCovers(s.packageId, serviceId));
  const benefit = loc(service.benefit);

  return (
    <article className="radar-details__content" style={{ ['--cat' as string]: CATEGORY_COLOR_VAR[event.category] }}>
      {/* In the pinned console only this part scrolls; the related-service footer stays in view. */}
      <div className="radar-details__scroll" data-lenis-prevent="">
        <header className="radar-details__hero">
          <span className="radar-details__badge" aria-hidden="true">
            <i className="radar-dot radar-dot--lg" />
          </span>
          <div className="radar-details__heading">
            <p className="radar-details__cat">{t(CAT_LABEL[event.category])}</p>
            <p className="radar-details__meta">
              <span>{t('radar.detailsEventId', { id: event.id })}</span>
              <span aria-hidden="true">·</span>
              <span>
                <span className="sr-only">{t('radar.detailsTime')} </span>
                {formatClock(event.t, lang)}
              </span>
            </p>
          </div>
        </header>

        <p className="radar-details__desc">{t(CAT_DESC[event.category][event.variant] ?? CAT_DESC[event.category][0])}</p>

        <dl className="radar-details__facts">
          <div className="radar-fact radar-fact--wide">
            <dt>{t('radar.detailsOrigin')}</dt>
            <dd>
              {region ? loc(region.label) : event.from}
              <span className="radar-fact__note">{t('radar.detailsOriginNote')}</span>
            </dd>
          </div>
          <div className="radar-fact">
            <dt>{t('radar.detailsTarget')}</dt>
            <dd>{t('radar.detailsTargetValue')}</dd>
          </div>
          <div className="radar-fact">
            <dt>{t('radar.detailsSeverity')}</dt>
            <dd className="radar-fact__inline" data-sev={event.severity}>
              <SeverityBars level={SEV_LEVEL[event.severity]} />
              {t(SEV_LABEL[event.severity])}
            </dd>
          </div>
          <div className="radar-fact radar-fact--wide">
            <dt>{t('radar.detailsOutcome')}</dt>
            <dd className="radar-fact__inline">
              <OutcomeIcon outcome={event.outcome} />
              {t(OUT_LABEL[event.outcome])}
            </dd>
            <dd className="radar-fact__note">{t(OUT_NOTE[event.outcome])}</dd>
          </div>
        </dl>

        <div className="radar-details__block">
          <h4 className="radar-details__h">{t('radar.detailsAbout')}</h4>
          <p>{t(CAT_ABOUT[event.category])}</p>
        </div>
        <div className="radar-details__block radar-details__block--response">
          <h4 className="radar-details__h">{t('radar.detailsResponse')}</h4>
          <p>{t(RESPONSE_TEXT[responseForEvent(event)])}</p>
        </div>
      </div>

      <div className="radar-service">
        <span className="radar-service__icon" aria-hidden="true">
          <ServiceIcon name={service.icon} />
        </span>
        <div className="radar-service__text">
          <p className="radar-service__label">{t('radar.detailsService')}</p>
          <p className="radar-service__name">{loc(service.name)}</p>
          {benefit && <p className="radar-service__benefit">{benefit}</p>}
        </div>
        <div className="radar-service__actions">
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => useUI.getState().openDetails(serviceId)}>
            {t('common.viewDetails')}
          </button>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => addServiceToRequest(serviceId)}
          >
            {inRequest ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}
            {inRequest ? t('common.inRequest') : t('common.addToRequest')}
          </button>
        </div>
      </div>
    </article>
  );
}

export function RadarDetails() {
  const { t } = useI18n();
  const event = useRadar(selectedEvent);
  const events = useRadar((s) => s.events);
  const filters = useRadar((s) => s.filters);
  const latest = useMemo(() => events.find((e) => filters[e.category]) ?? null, [events, filters]);

  return (
    <section
      className={`radar-panel radar-details${event ? ' has-event' : ''}`}
      aria-labelledby="radar-details-title"
    >
      <div className="radar-panel__head">
        <span className="radar-code" aria-hidden="true">
          SG//EVENT
        </span>
        <h3 id="radar-details-title" className="radar-panel__title">
          {t('radar.detailsTitle')}
        </h3>
        {event && (
          <button
            type="button"
            className="btn btn--ghost btn--sm btn--icon radar-details__clear"
            aria-label={t('radar.detailsClear')}
            title={t('radar.detailsClear')}
            onClick={() => {
              useRadar.getState().select(null);
              // The button disappears with the selection — hand focus back to the feed.
              document.querySelector<HTMLElement>('#radar .radar-row[tabindex="0"]')?.focus();
            }}
          >
            <X aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="radar-details__body" aria-live="polite" data-lenis-prevent="">
        {event ? (
          <Details key={event.id} event={event} />
        ) : (
          <div className="radar-details__empty">
            <span className="radar-details__empty-icon" aria-hidden="true">
              <Crosshair />
            </span>
            <p className="radar-details__empty-title">{t('radar.detailsEmptyTitle')}</p>
            <p className="radar-details__empty-text">{t('radar.detailsEmpty')}</p>
            <button
              type="button"
              className="btn btn--secondary btn--sm"
              disabled={!latest}
              onClick={() => latest && useRadar.getState().select(latest.id)}
            >
              {t('radar.detailsInspectLatest')}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
