// Compact simulated event feed (newest first). Each row is a toggle button; one tab stop with arrow-key
// navigation so keyboard users are not forced through every row. Selecting syncs globe, graph and details.
// While the mouse is over the list (or keyboard focus is inside it) new rows are held back so the row under
// the pointer never shifts; a pill shows how many arrived and releases them on demand.
import { memo, useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from 'react';
import { ArrowUp, Eye, Flag, ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n';
import { regionById } from '../../lib/geo';
import { CATEGORY_COLOR_VAR, useRadar, type Outcome, type ThreatEvent } from '../../state/radar';
import { CAT_SHORT, OUT_LABEL, SEV_LABEL, SEV_LEVEL, formatClock } from './radarText';

const MAX_ROWS = 60;

export function OutcomeIcon({ outcome }: { outcome: Outcome }) {
  const Icon = outcome === 'blocked' ? ShieldCheck : outcome === 'flagged' ? Flag : Eye;
  return <Icon aria-hidden="true" className={`radar-out-icon radar-out-icon--${outcome}`} strokeWidth={1.8} />;
}

export function SeverityBars({ level }: { level: number }) {
  return (
    <span className="radar-sev" data-level={level} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

/** One feed row. Memoised: a new event renders one row, not the whole list (events are immutable). */
const FeedRow = memo(function FeedRow({
  event: e,
  selected,
  tabStop,
}: {
  event: ThreatEvent;
  selected: boolean;
  tabStop: boolean;
}) {
  const { t, loc, lang } = useI18n();
  const region = regionById(e.from);
  return (
    <li className="radar-feed__item">
      <button
        type="button"
        className="radar-row"
        aria-pressed={selected}
        tabIndex={tabStop ? 0 : -1}
        data-sev={e.severity}
        style={{ ['--cat' as string]: CATEGORY_COLOR_VAR[e.category] }}
        onClick={() => useRadar.getState().select(selected ? null : e.id)}
      >
        <span className="radar-row__time">{formatClock(e.t, lang)}</span>
        <span className="radar-row__cat">
          <i className="radar-dot" aria-hidden="true" />
          <span className="radar-row__catlabel">{t(CAT_SHORT[e.category])}</span>
        </span>
        <span className="radar-row__region" title={region ? loc(region.label) : undefined}>
          <span className="sr-only">{t('radar.srRegion')} </span>
          {region ? loc(region.label) : e.from}
        </span>
        <span className="radar-row__sev">
          <span className="sr-only">{t('radar.srSeverity')} </span>
          <SeverityBars level={SEV_LEVEL[e.severity]} />
          <span className="radar-row__sevtext">{t(SEV_LABEL[e.severity])}</span>
        </span>
        <span className={`radar-row__out radar-row__out--${e.outcome}`}>
          <span className="sr-only">{t('radar.srOutcome')} </span>
          <OutcomeIcon outcome={e.outcome} />
          <span className="radar-row__outtext">{t(OUT_LABEL[e.outcome])}</span>
        </span>
      </button>
    </li>
  );
});

export function RadarFeed() {
  const { t } = useI18n();
  const events = useRadar((s) => s.events);
  const filters = useRadar((s) => s.filters);
  const selectedId = useRadar((s) => s.selectedId);
  const paused = useRadar((s) => s.paused);
  const listRef = useRef<HTMLOListElement>(null);

  // Hold: newest sequence number still shown (null = live). Hover and keyboard focus are tracked separately.
  const [ceiling, setCeiling] = useState<number | null>(null);
  const holdRef = useRef({ hover: false, focus: false });
  const newestSeq = events[0]?.seq ?? 0;
  const startHold = (kind: 'hover' | 'focus') => {
    holdRef.current[kind] = true;
    setCeiling((c) => c ?? newestSeq);
  };
  const endHold = (kind: 'hover' | 'focus') => {
    holdRef.current[kind] = false;
    if (!holdRef.current.hover && !holdRef.current.focus) setCeiling(null);
  };
  const onPointerEnter = (e: PointerEvent) => e.pointerType === 'mouse' && startHold('hover');
  const onPointerLeave = (e: PointerEvent) => e.pointerType === 'mouse' && endHold('hover');
  // Only keyboard focus holds (a mouse click leaves focus on the row, which must not freeze the feed).
  const onFocusIn = (e: FocusEvent<HTMLElement>) => {
    if (e.target.matches(':focus-visible')) startHold('focus');
  };
  const onFocusOut = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) endHold('focus');
  };

  const { rows, held } = useMemo(() => {
    const out: ThreatEvent[] = [];
    let pending = 0;
    for (const e of events) {
      if (!filters[e.category]) continue;
      if (ceiling !== null && e.seq > ceiling) {
        pending++;
        continue;
      }
      out.push(e);
      if (out.length >= MAX_ROWS) break; // newest first: every held event was counted before this point
    }
    return { rows: out, held: pending };
  }, [events, filters, ceiling]);

  const anyFilter = filters.phishing || filters.login || filters.scanning || filters.traffic;
  const tabStopId = rows.some((e) => e.id === selectedId) ? selectedId : (rows[0]?.id ?? null);

  const onKeyDown = (event: KeyboardEvent<HTMLOListElement>) => {
    const keys = ['ArrowDown', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('.radar-row') ?? []);
    const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (index < 0) return;
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : Math.max(0, Math.min(buttons.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
    buttons[next]?.focus();
  };

  return (
    <section className="radar-panel radar-feed" aria-labelledby="radar-feed-title">
      <div className="radar-panel__head">
        <span className="radar-code" aria-hidden="true">
          SG//FEED
        </span>
        <h3 id="radar-feed-title" className="radar-panel__title">
          {t('radar.feedTitle')}
        </h3>
        <span className={`radar-status${paused ? ' is-paused' : ''}`}>
          <i className="radar-status__led" aria-hidden="true" />
          {paused ? t('radar.statusPaused') : t('radar.statusLive')}
        </span>
      </div>
      <p className="badge badge--demo radar-feed__demo">{t('radar.demoLabel')}</p>

      <div className="radar-feed__cols" aria-hidden="true">
        <span>{t('radar.colTime')}</span>
        <span>{t('radar.colCategory')}</span>
        <span>{t('radar.colRegion')}</span>
        <span>{t('radar.colSeverity')}</span>
        <span>{t('radar.colOutcome')}</span>
      </div>

      {rows.length === 0 && held === 0 ? (
        <p className="radar-feed__empty">{anyFilter ? t('radar.feedEmpty') : t('radar.feedFilteredEmpty')}</p>
      ) : (
        <div
          className="radar-feed__body"
          onPointerEnter={onPointerEnter}
          onPointerLeave={onPointerLeave}
          onFocus={onFocusIn}
          onBlur={onFocusOut}
        >
          {held > 0 && (
            <button type="button" className="radar-feed__held" onClick={() => setCeiling(newestSeq)}>
              <ArrowUp aria-hidden="true" />
              {t('radar.feedHeld', { count: held })}
            </button>
          )}
          <p id="radar-feed-keys" className="sr-only">
            {t('radar.feedKeysHint')}
          </p>
          <ol
            ref={listRef}
            className="radar-feed__list"
            aria-label={t('radar.feedListLabel')}
            aria-describedby="radar-feed-keys"
            data-lenis-prevent=""
            onKeyDown={onKeyDown}
          >
            {rows.map((e) => (
              <FeedRow key={e.id} event={e} selected={e.id === selectedId} tabStop={e.id === tabStopId} />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}
