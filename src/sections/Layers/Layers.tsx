// Scene C — Defense Layers. The 3D network and its five shells are drawn by the world scene from T;
// this DOM layer tells the story in sync with it via useSectionStep(ref, activeLayerIndex).
// Static experience: an ordered list of the five layers beside a static SVG network diagram.
import { useRef, type CSSProperties, type RefObject } from 'react';
import { ArrowDown, CalendarSync, Cloud, Globe, KeyRound, Mail, ShoppingCart, type LucideIcon } from 'lucide-react';
import type { ServiceId } from '../../data/types';
import { useI18n, type TKey } from '../../i18n';
import { LAYER_ORDER, SCROLLY_HEIGHT, activeLayerIndex, clamp01, type LayerKey } from '../../lib/choreo';
import { getLenis } from '../../lib/smoothScroll';
import { useSectionProgress, useSectionStep } from '../../lib/useSectionProgress';
import { useExperience } from '../../state/experience';
import { useUI } from '../../state/ui';
import { NetworkDiagram } from './NetworkDiagram';
import { ServiceLink } from './ServiceLink';
import './Layers.css';

const TOTAL = LAYER_ORDER.length;
const pad = (n: number) => String(n).padStart(2, '0');

/** Service that strengthens each layer (matches Service.layer in the catalog). */
const LAYER_SERVICE: Record<LayerKey, ServiceId> = {
  website: 'website-assessment',
  email: 'awareness',
  cloud: 'backup-recovery',
  accounts: 'email-accounts',
  ongoing: 'monthly-review',
};

const LAYER_ICON: Record<LayerKey, LucideIcon> = {
  website: Globe,
  email: Mail,
  cloud: Cloud,
  accounts: KeyRound,
  ongoing: CalendarSync,
};

const copyKey = (layer: LayerKey, part: 'Name' | 'Short' | 'Risk' | 'Value') => `layers.${layer}${part}` as TKey;

// Step boundaries are derived from choreo's activeLayerIndex (bisection), so the rail and the
// "scroll to layer" targets can never drift from the 3D timeline.
function stepStart(i: number): number {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 32; k++) {
    const mid = (lo + hi) / 2;
    if (activeLayerIndex(mid) >= i) hi = mid;
    else lo = mid;
  }
  return hi;
}
const STARTS = LAYER_ORDER.map((_, i) => stepStart(i));
const SPAN = STARTS[1] - STARTS[0];
const CENTERS = STARTS.map((s) => s + SPAN * 0.5);
/** Rail fill 0..1 between the first and last tick (tick i sits at the centre of step i). */
const railFill = (p: number) => clamp01((p - CENTERS[0]) / (CENTERS[TOTAL - 1] - CENTERS[0]));

export function Layers() {
  const mode = useExperience((s) => s.mode);
  const ref = useRef<HTMLElement>(null);
  const isStatic = mode === 'static';
  const style = {
    '--scrolly-h': SCROLLY_HEIGHT.layers.desktop,
    '--layers-h-mobile': SCROLLY_HEIGHT.layers.mobile,
  } as CSSProperties;
  return (
    <section
      id="layers"
      ref={ref}
      className={`scrolly layers${isStatic ? ' layers--static' : ''}`}
      aria-labelledby="layers-title"
      style={style}
    >
      <div className="scrolly__pin">{isStatic ? <LayersStatic /> : <LayersStory sectionRef={ref} />}</div>
    </section>
  );
}

// ---------------------------------------------------------------- Cinematic (sticky) story

function LayersStory({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  const { t } = useI18n();
  const step = useSectionStep(sectionRef, activeLayerIndex);
  const railRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);

  // Continuous rail fill without re-rendering.
  useSectionProgress(sectionRef, (p) => {
    railRef.current?.style.setProperty('--layers-fill', railFill(p).toFixed(4));
    hudRef.current?.style.setProperty('--layers-p', p.toFixed(4));
  });

  const goTo = (i: number) => {
    const el = sectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const y = top + CENTERS[i] * Math.max(0, el.offsetHeight - window.innerHeight);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y, { duration: 1.2 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const slideState = (i: number) => (i === step ? 'active' : i < step ? 'past' : 'future');
  const announcement =
    step >= 0 ? t('layers.announce', { n: step + 1, total: TOTAL, name: t(copyKey(LAYER_ORDER[step], 'Name')) }) : '';

  return (
    <div className="layers-stage container" data-step={step}>
      <div className="layers-panel panel">
        <header className="layers-panel__head" aria-hidden="true">
          <span className="layers-tm layers-tm--brand layers-tm--code">{t('layers.telemetry')}</span>
          <span className="layers-tm">
            {step < 0 ? t('layers.introCounter', { total: pad(TOTAL) }) : t('layers.counter', { n: pad(step + 1), total: pad(TOTAL) })}
          </span>
        </header>

        <h2 id="layers-title" className="layers-title" data-compact={step >= 0 ? 'true' : 'false'}>
          {t('layers.title')}
        </h2>

        <div className="layers-slides">
          <div
            className="layers-slide layers-slide--intro"
            data-state={slideState(-1)}
            aria-hidden={step !== -1}
            inert={step !== -1}
          >
            <p className="layers-lead layers-stag" style={{ '--i': 0 } as CSSProperties}>
              {t('layers.lead')}
            </p>
            <ol className="layers-preview layers-stag" style={{ '--i': 1 } as CSSProperties}>
              {LAYER_ORDER.map((key, i) => {
                const Icon = LAYER_ICON[key];
                return (
                  <li key={key}>
                    <span className="layers-preview__num" aria-hidden="true">
                      {pad(i + 1)}
                    </span>
                    <Icon aria-hidden="true" />
                    {t(copyKey(key, 'Name'))}
                  </li>
                );
              })}
            </ol>
            <p className="layers-hint layers-stag" style={{ '--i': 2 } as CSSProperties}>
              <ArrowDown aria-hidden="true" />
              {t('layers.scrollHint')}
            </p>
          </div>

          {LAYER_ORDER.map((key, i) => (
            <article
              key={key}
              className="layers-slide"
              data-state={slideState(i)}
              aria-hidden={step !== i}
              inert={step !== i}
              aria-labelledby={`layers-step-${key}`}
            >
              <LayerBody layer={key} index={i} headingId={`layers-step-${key}`} showCount={false} />
            </article>
          ))}
        </div>

        <nav className="layers-rail" aria-label={t('layers.railLabel')} ref={railRef}>
          <span className="layers-rail__track" aria-hidden="true">
            <span className="layers-rail__fill" />
          </span>
          <ol>
            {LAYER_ORDER.map((key, i) => (
              <li key={key}>
                <button
                  type="button"
                  className="layers-rail__btn"
                  data-done={i < step ? 'true' : 'false'}
                  aria-current={i === step ? 'step' : undefined}
                  onClick={() => goTo(i)}
                >
                  <span className="layers-rail__tick" aria-hidden="true" />
                  <span className="layers-rail__num">{pad(i + 1)}</span>
                  <span className="layers-rail__label">{t(copyKey(key, 'Short'))}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Telemetry HUD on the end side, over the network (decorative). */}
      <div className="layers-hud" ref={hudRef} aria-hidden="true">
        <span className="layers-tm layers-tm--brand layers-tm--code">SG//NET 03</span>
        <span className="layers-tm">{t('layers.shellsActive', { n: pad(step + 1), total: pad(TOTAL) })}</span>
        <span className="layers-hud__bars">
          {LAYER_ORDER.map((key, i) => (
            <span key={key} data-on={i <= step ? 'true' : 'false'} />
          ))}
        </span>
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------- Shared layer content

interface LayerBodyProps {
  layer: LayerKey;
  index: number;
  headingId: string;
  /** The sticky panel already shows the counter in its header. */
  showCount?: boolean;
}

function LayerBody({ layer, index, headingId, showCount = true }: LayerBodyProps) {
  const { t } = useI18n();
  const Icon = LAYER_ICON[layer];
  return (
    <>
      <div className="layers-body__head layers-stag" style={{ '--i': 0 } as CSSProperties}>
        <span className="layers-glyph" aria-hidden="true">
          <Icon />
        </span>
        <div>
          {showCount && (
            <p className="layers-tm layers-tm--brand">{t('layers.counter', { n: pad(index + 1), total: pad(TOTAL) })}</p>
          )}
          <h3 id={headingId} className="layers-body__name">
            {t(copyKey(layer, 'Name'))}
          </h3>
        </div>
      </div>
      <dl className="layers-facts">
        <div className="layers-fact layers-fact--risk layers-stag" style={{ '--i': 1 } as CSSProperties}>
          <dt>{t('layers.riskLabel')}</dt>
          <dd>{t(copyKey(layer, 'Risk'))}</dd>
        </div>
        <div className="layers-fact layers-fact--value layers-stag" style={{ '--i': 2 } as CSSProperties}>
          <dt>{t('layers.valueLabel')}</dt>
          <dd>
            {t(copyKey(layer, 'Value'))}
            {layer === 'ongoing' && <span className="layers-note">{t('layers.ongoingNote')}</span>}
          </dd>
        </div>
      </dl>
      <div className="layers-body__svc layers-stag" style={{ '--i': 3 } as CSSProperties}>
        <ServiceLink id={LAYER_SERVICE[layer]} label={t('layers.serviceLabel')} compact />
        {layer === 'website' && (
          <p className="layers-store">
            <ShoppingCart aria-hidden="true" />
            <span>{t('layers.storeNote')}</span>
            <button type="button" className="btn btn--link layers-store__link" onClick={() => useUI.getState().openDetails('ecommerce-review')}>
              {t('layers.storeLink')}
            </button>
          </p>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------- Static experience

function LayersStatic() {
  const { t } = useI18n();
  return (
    <div className="container layers-static">
      <header className="section-head">
        <p className="eyebrow">{t('layers.eyebrow')}</p>
        <h2 id="layers-title" className="h2">
          {t('layers.title')}
        </h2>
        <p className="lead">{t('layers.leadStatic')}</p>
      </header>
      <div className="layers-static__grid">
        <figure className="layers-static__figure panel">
          <span className="layers-tm layers-tm--brand layers-tm--code layers-static__tm">SG//NET 03</span>
          <NetworkDiagram />
          <figcaption>{t('layers.diagramCaption')}</figcaption>
        </figure>
        <ol className="layers-static__list" aria-label={t('layers.staticNote')}>
          {LAYER_ORDER.map((key, i) => (
            <li key={key} className="card layers-card">
              <LayerBody layer={key} index={i} headingId={`layers-card-${key}`} />
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
