// Service constellation (#explore) — Hamol-inspired sticky scrollytelling over the 3D constellation (Scene D):
// a contextual panel on the left updates service by service as you scroll, accessible hotspot buttons sit over
// each 3D object, a drag surface rotates the constellation, and an index of eight dots jumps to any service.
// Static mode (no WebGL / reduced motion) renders a readable grid of the same eight services instead.
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Mouse, MousePointerClick, MoveHorizontal } from 'lucide-react';
import { BUSINESS_SERVICE_IDS, getService } from '../../data/services';
import { categoryById } from '../../data/categories';
import { useI18n } from '../../i18n';
import { CONSTELLATION_COUNT, SCROLLY_HEIGHT, constellationFocusIndex } from '../../lib/choreo';
import { getLenis } from '../../lib/smoothScroll';
import { useSectionStep } from '../../lib/useSectionProgress';
import { useExperience } from '../../state/experience';
import { serviceScrollTop } from '../../state/constellation';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { ConstellationStage } from './ConstellationStage';
import { ConstellationStatic } from './ConstellationStatic';
import { ServiceActions, pad2, pricingLabel, useMedia } from './shared';
import './Constellation.css';

export function Constellation() {
  const mode = useExperience((s) => s.mode);
  return mode === 'static' ? <ConstellationStatic /> : <ConstellationCinematic />;
}

function ConstellationCinematic() {
  const { t, loc, lang } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const narrow = useMedia('(max-width: 819px)');
  const coarse = useMedia('(pointer: coarse)');
  const index = useSectionStep(sectionRef, constellationFocusIndex);
  const [announce, setAnnounce] = useState('');

  // Direction of the last change, so text slides the way the visitor is scrolling (and back).
  const prevIndex = useRef(index);
  const dir = index > prevIndex.current ? 'down' : index < prevIndex.current ? 'up' : 'none';
  useEffect(() => {
    prevIndex.current = index;
  }, [index]);

  const goTo = useCallback(
    (i: number) => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + window.scrollY;
      const y = serviceScrollTop(top, el.offsetHeight, window.innerHeight, i, CONSTELLATION_COUNT);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(y, { duration: 1.1, force: true });
      else window.scrollTo({ top: y, behavior: 'smooth' });
      const name = loc(getService(BUSINESS_SERVICE_IDS[i]).name);
      setAnnounce(t('constellation.announce', { n: i + 1, total: CONSTELLATION_COUNT, name }));
    },
    [loc, t],
  );

  const id = BUSINESS_SERVICE_IDS[index];
  const service = getService(id);
  const total = CONSTELLATION_COUNT;
  const height = narrow ? SCROLLY_HEIGHT.constellation.mobile : SCROLLY_HEIGHT.constellation.desktop;

  return (
    <section
      id="explore"
      ref={sectionRef}
      className="scrolly cst"
      aria-labelledby="explore-title"
      style={{ '--scrolly-h': height } as CSSProperties}
    >
      <div className="scrolly__pin cst-pin" ref={pinRef}>
        <div className="cst-shade" aria-hidden="true" />

        <div className="cst-layout">
          <header className="cst-head">
            <p className="eyebrow">{t('constellation.eyebrow')}</p>
            <h2 id="explore-title" className="h2 cst-title">
              {t('constellation.title')}
            </h2>
            <a className="cst-skip" href="#catalog">
              {t('common.skipSequence')}
            </a>
          </header>

          <article className="cst-panel glow-border" aria-labelledby="cst-name">
            <div className="cst-panel__top">
              <span className="telemetry cst-tele">
                {t('constellation.telemetry', { n: pad2(index + 1), total: pad2(total) })}
              </span>
              <span className="badge badge--teal">{loc(categoryById(service.category).label)}</span>
            </div>
            <div className="cst-progress" aria-hidden="true">
              {BUSINESS_SERVICE_IDS.map((sid, i) => (
                <span key={sid} data-state={i < index ? 'past' : i === index ? 'current' : 'next'} />
              ))}
            </div>
            <div key={index} className="cst-panel__body" data-dir={dir}>
              <div className="cst-title-row">
                <span className="cst-icon scan-sweep" aria-hidden="true">
                  <ServiceIcon name={service.icon} />
                </span>
                <h3 id="cst-name" className="h3 cst-name">
                  {loc(service.name)}
                </h3>
              </div>
              <p className="cst-benefit">{loc(service.benefit)}</p>
              <dl className="cst-facts">
                <div className="cst-fact cst-fact--audience">
                  <dt>{t('constellation.audienceShort')}</dt>
                  <dd>{loc(service.audienceText)}</dd>
                </div>
                <div className="cst-fact">
                  <dt>{t('constellation.durationShort')}</dt>
                  <dd>{loc(service.duration)}</dd>
                </div>
                <div className="cst-fact">
                  <dt>{t('constellation.pricingShort')}</dt>
                  <dd>{pricingLabel(service, t, lang)}</dd>
                </div>
              </dl>
              {service.requiresAuthorization ? <p className="cst-auth">{t('common.authorizationRequired')}</p> : null}
            </div>
            <ServiceActions id={id} compact={narrow} />
          </article>

          <p className="cst-hint telemetry">
            <span>
              <Mouse aria-hidden="true" />
              {t('constellation.hintScroll')}
            </span>
            <span className="cst-hint__sep" aria-hidden="true">
              ·
            </span>
            <span>
              <MoveHorizontal aria-hidden="true" />
              {t('constellation.hintDrag')}
            </span>
            <span className="cst-hint__sep" aria-hidden="true">
              ·
            </span>
            <span>
              <MousePointerClick aria-hidden="true" />
              {coarse ? t('constellation.hintTap') : t('constellation.hintClick')}
            </span>
          </p>

          <div className="cst-counter" aria-hidden="true">
            <span className="cst-counter__now">{pad2(index + 1)}</span>
            <span className="cst-counter__total">/ {pad2(total)}</span>
          </div>
        </div>
        <ConstellationStage pinRef={pinRef} sectionRef={sectionRef} index={index} />

        <div className="cst-rail">
          <nav className="cst-index" aria-label={t('constellation.indexLabel')}>
            <ol>
              {BUSINESS_SERVICE_IDS.map((sid, i) => {
                const name = loc(getService(sid).name);
                return (
                  <li key={sid}>
                    <button
                      type="button"
                      className="cst-dot"
                      aria-label={t('constellation.dotLabel', { n: i + 1, name })}
                      aria-current={i === index ? 'step' : undefined}
                      onClick={() => goTo(i)}
                    >
                      <span className="cst-dot__mark" aria-hidden="true" />
                      <span className="cst-dot__tip" aria-hidden="true">
                        <span className="cst-dot__num">{pad2(i + 1)}</span>
                        {name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
        <p className="sr-only" aria-live="polite">
          {announce}
        </p>
      </div>
    </section>
  );
}
