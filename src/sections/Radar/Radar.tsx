// Scene B — Global Threat Radar (SIMULATED LIVE DEMO). The 3D globe + arcs are drawn by the world scene from
// the same radar store; this section owns the data generator, the DOM console and the 2D/static globe.
//
// Layouts:
//   sticky  — cinematic, ≥ 820px: pinned console over the 3D globe; intro + panels reveal with scroll progress
//   static  — static mode, ≥ 820px: readable two-column console with the SVG globe, no scroll-scrubbed motion
//   stacked — < 820px (any mode): globe card, filters, feed, details, graph in one column
import { useEffect, useRef, useState, type FocusEvent } from 'react';
import { SkipForward } from 'lucide-react';
import { useI18n } from '../../i18n';
import { SCROLLY_HEIGHT, SECTION_IDS } from '../../lib/choreo';
import { scheduleRefresh } from '../../lib/smoothScroll';
import { useSectionProgress } from '../../lib/useSectionProgress';
import { useThreatSimulation } from '../../lib/threatSim';
import { useExperience } from '../../state/experience';
import { RadarControls } from './RadarControls';
import { RadarDetails } from './RadarDetails';
import { RadarFeed } from './RadarFeed';
import { RadarGraph } from './RadarGraph';
import { StaticGlobe } from './StaticGlobe';
import './Radar.css';

type Layout = 'sticky' | 'static' | 'stacked';
const NARROW_QUERY = '(max-width: 819.98px)';

function useMediaQuery(query: string): boolean {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return match;
}

/** Inline style for the staggered reveal index. */
const d = (i: number) => ({ ['--d' as string]: i });

export function Radar() {
  const { t } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const mode = useExperience((s) => s.mode);
  const reduced = useExperience((s) => s.reducedMotion);
  const narrow = useMediaQuery(NARROW_QUERY);
  const layout: Layout = narrow ? 'stacked' : mode === 'static' ? 'static' : 'sticky';
  const sticky = layout === 'sticky';
  const { active } = useThreatSimulation(ref);

  // Section height changes between layouts → re-measure the world timeline anchors.
  useEffect(() => scheduleRefresh(80), [layout]);

  // Scroll choreography (sticky only): --ra = approach (section entering), --rp = pinned progress.
  useSectionProgress(
    ref,
    (p) => {
      const el = ref.current;
      if (!el) return;
      el.style.setProperty('--rp', p.toFixed(4));
      const ready = p > 0.1 ? 'true' : 'false';
      if (el.dataset.ready !== ready) el.dataset.ready = ready;
    },
    { enabled: sticky },
  );
  useSectionProgress(ref, (a) => ref.current?.style.setProperty('--ra', a.toFixed(4)), {
    start: 'top bottom',
    end: 'top top',
    enabled: sticky,
  });

  // Never hide a focused control: keyboard focus anywhere inside reveals the whole console.
  const onFocus = () => {
    if (ref.current) ref.current.dataset.force = 'true';
  };
  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (ref.current && !ref.current.contains(e.relatedTarget as Node | null)) delete ref.current.dataset.force;
  };

  const intro = (
    <header className="radar-intro">
      <p className="eyebrow radar-reveal" style={d(0)}>
        {t('radar.eyebrow')}
      </p>
      <h2 id="radar-title" className="h2 radar-intro__title radar-reveal" style={d(1)}>
        {t('radar.title')}
      </h2>
      <p className="badge badge--demo radar-intro__demo radar-reveal" style={d(2)}>
        {t('radar.demoLabel')}
      </p>
      <p className="lead radar-intro__lead radar-reveal" style={d(3)}>
        {t('radar.lead')}
      </p>
      <p className="radar-intro__note radar-reveal" style={d(4)}>
        {t('radar.note')}
      </p>
      <div className="radar-intro__actions radar-reveal" style={d(5)}>
        <a className="btn btn--ghost btn--sm radar-skip" href={`#${SECTION_IDS.catalog}`}>
          <SkipForward aria-hidden="true" className="icon-flip" />
          {t('common.skipSequence')}
        </a>
        {sticky && (
          <span className="radar-hud" aria-hidden="true">
            <span className="radar-hud__item">
              <i className="radar-hud__home" />
              {t('radar.globeHome')}
            </span>
            <span className="radar-hud__item">
              <i className="radar-hud__arc" />
              {t('radar.globeTitle')}
            </span>
          </span>
        )}
      </div>
    </header>
  );

  const globe = (
    <section className="radar-panel radar-globe" aria-labelledby="radar-globe-title">
      <div className="radar-panel__head">
        <span className="radar-code" aria-hidden="true">
          SG//GLOBE
        </span>
        <h3 id="radar-globe-title" className="radar-panel__title">
          {t('radar.globeTitle')}
        </h3>
        <span className="badge badge--demo radar-globe__badge">{t('common.simulatedBadge')}</span>
      </div>
      <StaticGlobe rotate={layout === 'stacked' && mode === 'cinematic' && !reduced} />
    </section>
  );

  const deck = (
    <div className="radar-panel radar-deck radar-rise" style={d(2)}>
      <RadarControls />
      <RadarGraph running={active} />
    </div>
  );

  return (
    <section
      id={SECTION_IDS.radar}
      ref={ref}
      className="scrolly radar"
      data-layout={layout}
      aria-labelledby="radar-title"
      style={{ ['--scrolly-h' as string]: narrow ? SCROLLY_HEIGHT.radar.mobile : SCROLLY_HEIGHT.radar.desktop }}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      <div className="scrolly__pin radar__pin">
        <div className="radar__layout">
          {intro}
          {layout === 'sticky' && (
            <>
              <div className="radar__console">
                <div className="radar-slide radar__feedwrap" style={d(0)}>
                  <RadarFeed />
                </div>
                <div className="radar-slide radar__detailswrap" style={d(1)}>
                  <RadarDetails />
                </div>
              </div>
              {deck}
            </>
          )}
          {layout === 'static' && (
            <>
              <div className="radar__col radar__col--start">
                {globe}
                {deck}
              </div>
              <div className="radar__col radar__col--end">
                <RadarFeed />
                <RadarDetails />
              </div>
            </>
          )}
          {layout === 'stacked' && (
            <>
              {globe}
              <div className="radar-panel radar-controls-panel">
                <RadarControls />
              </div>
              <RadarFeed />
              <RadarDetails />
              <div className="radar-panel radar-graph-panel">
                <RadarGraph running={active} />
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
