// Category filter chips (with simulated counts) + "All" + pause/resume. Filters drive feed, globe and graph.
import { Pause } from 'lucide-react';
import { formatNumber, useI18n } from '../../i18n';
import { CATEGORY_COLOR_VAR, THREAT_CATEGORIES, totalCount, useRadar } from '../../state/radar';
import { CAT_LABEL, STACK_ORDER } from './radarText';

export function RadarControls() {
  const { t, lang } = useI18n();
  const filters = useRadar((s) => s.filters);
  const totals = useRadar((s) => s.totals);
  const paused = useRadar((s) => s.paused);
  const total = totalCount({ totals });
  const allOn = THREAT_CATEGORIES.every((c) => filters[c]);

  return (
    <div className="radar-controls">
      <div className="radar-panel__head">
        <span className="radar-code" aria-hidden="true">
          SG//FILTER
        </span>
        <h3 className="radar-panel__title">{t('radar.controlsTitle')}</h3>
        <button
          type="button"
          className="btn btn--secondary btn--sm radar-pause"
          aria-pressed={paused}
          title={t('radar.pauseHint')}
          onClick={() => useRadar.getState().setPaused(!paused)}
        >
          <Pause aria-hidden="true" />
          <span>{t('radar.pause')}</span>
        </button>
      </div>

      <p className="radar-totals">
        <span className="radar-totals__label">{t('radar.totalsLabel')}</span>
        <span className="radar-totals__value">{formatNumber(total, lang)}</span>
      </p>

      <div className="radar-chips" role="group" aria-label={t('radar.controlsLabel')}>
        <button
          type="button"
          className="chip radar-chip radar-chip--all"
          aria-pressed={allOn}
          onClick={() => useRadar.getState().setAllFilters(true)}
        >
          <span className="radar-chip__glyph" aria-hidden="true" />
          <span className="radar-chip__label">{t('radar.filterAll')}</span>
          <span className="radar-chip__count">{formatNumber(total, lang)}</span>
        </button>
        {STACK_ORDER.map((c) => (
          <button
            key={c}
            type="button"
            className="chip radar-chip"
            aria-pressed={filters[c]}
            style={{ ['--chip-dot' as string]: CATEGORY_COLOR_VAR[c] }}
            onClick={() => useRadar.getState().toggleFilter(c)}
          >
            <span className="chip__dot" aria-hidden="true" />
            <span className="radar-chip__label">{t(CAT_LABEL[c])}</span>
            <span className="radar-chip__count">
              {formatNumber(totals[c], lang)}
              <span className="sr-only"> {t('radar.totalsLabel')}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
