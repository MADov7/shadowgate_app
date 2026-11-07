// Scene E — Build Your Protection (sticky). DOM side of the scene: a request summary and a symbolic
// completeness meter flanking the 3D structure (src/three/BuildStructure.tsx, same count logic).
// Static mode swaps the 3D structure for an SVG gate built from the same nine segments.
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Blocks, Compass, LayoutGrid, ListChecks, PackageCheck, Pencil, ShieldAlert, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useBasket } from '../../state/basket';
import { useUI } from '../../state/ui';
import { useExperience } from '../../state/experience';
import { removeServiceFromRequest, selectPackage } from '../../state/actions';
import { getService } from '../../data/services';
import { getPackage } from '../../data/packages';
import type { ServiceId } from '../../data/types';
import { SCROLLY_HEIGHT, SECTION_IDS } from '../../lib/choreo';
import { scrollToId } from '../../lib/smoothScroll';
import { useSectionProgress } from '../../lib/useSectionProgress';
import { illustrativeParts, STRUCTURE_SEGMENTS, structureSegmentCount } from '../../lib/requests';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { BuildGateSvg } from './BuildGateSvg';
import './Build.css';

const NARROW_QUERY = '(max-width: 819.98px)';

/** True below 820px — sticky heights use the shorter mobile values there. */
export function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(NARROW_QUERY).matches);
  useEffect(() => {
    const mql = window.matchMedia(NARROW_QUERY);
    const onChange = () => setNarrow(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return narrow;
}

export function Build() {
  const { t } = useI18n();
  const isStatic = useExperience((s) => s.mode === 'static');
  const narrow = useNarrowViewport();
  const ref = useRef<HTMLElement>(null);
  const serviceCount = useBasket((s) => s.serviceIds.length);
  const hasPackage = useBasket((s) => s.packageId !== null);
  const count = structureSegmentCount(serviceCount, hasPackage);

  // Scroll-scrubbed choreography (reversible): columns slide in from their sides, then the pips assemble.
  useSectionProgress(ref, (p) => ref.current?.style.setProperty('--build-p', p.toFixed(4)), {
    start: 'top 85%',
    end: 'bottom bottom',
    enabled: !isStatic,
  });

  const height = narrow ? SCROLLY_HEIGHT.build.mobile : SCROLLY_HEIGHT.build.desktop;
  const meterText = t('build.meterValue', { count, max: STRUCTURE_SEGMENTS });

  return (
    <section
      id={SECTION_IDS.build}
      ref={ref}
      className="scrolly build"
      aria-labelledby="build-title"
      data-count={count}
      style={{ ['--scrolly-h' as string]: height }}
    >
      <div className="scrolly__pin build__pin">
        <div className="container build__grid">
          <div className="build__intro">
            <p className="eyebrow">{t('build.eyebrow')}</p>
            <h2 id="build-title" className="h2 build__title">
              {t('build.title')}
            </h2>
            <p className="build__lead">{t('build.lead')}</p>

            <div
              className="build-meter"
              role="meter"
              aria-label={t('build.meterLabel')}
              aria-valuemin={0}
              aria-valuemax={STRUCTURE_SEGMENTS}
              aria-valuenow={count}
              aria-valuetext={meterText}
            >
              <div className="build-meter__head">
                <span className="build-meter__value">{meterText}</span>
                <span className="telemetry build-meter__tele" aria-hidden="true">
                  {t('build.telemetry', { count, max: STRUCTURE_SEGMENTS })}
                </span>
              </div>
              <div className="build-meter__pips" aria-hidden="true">
                {Array.from({ length: STRUCTURE_SEGMENTS }, (_, i) => (
                  <span key={i} className="build-pip" data-lit={i < count || undefined} style={{ ['--i' as string]: i }} />
                ))}
              </div>
              <p className="build-meter__hint">
                {count >= STRUCTURE_SEGMENTS ? t('build.meterComplete', { max: STRUCTURE_SEGMENTS }) : t('build.meterHint')}
              </p>
            </div>

            <p className="build__note">
              <Blocks aria-hidden="true" />
              <span>{t('common.symbolicNote')}</span>
            </p>
          </div>

          <div className="build__stage">
            {isStatic ? (
              <figure className="build__figure">
                <BuildGateSvg count={count} label={t('build.staticCaption', { count, max: STRUCTURE_SEGMENTS })} />
                <figcaption className="telemetry">{t('build.staticCaption', { count, max: STRUCTURE_SEGMENTS })}</figcaption>
              </figure>
            ) : null}
          </div>

          <BuildSummary />
        </div>
      </div>
    </section>
  );
}

function BuildSummary() {
  const { t, loc, lang } = useI18n();
  const serviceIds = useBasket((s) => s.serviceIds);
  const packageId = useBasket((s) => s.packageId);
  const pkg = packageId ? getPackage(packageId) : null;
  const total = serviceIds.length + (pkg ? 1 : 0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const removeRefs = useRef(new Map<string, HTMLButtonElement>());

  // Removing a row deletes the focused button: move focus to the next row (or the panel title) instead of <body>.
  const removeAndRefocus = (key: string, remove: () => void) => {
    const keys = [...(pkg ? ['package'] : []), ...serviceIds];
    const next = keys[keys.indexOf(key) + 1] ?? keys[keys.indexOf(key) - 1];
    remove();
    requestAnimationFrame(() => {
      const target = next ? removeRefs.current.get(next) : null;
      (target ?? titleRef.current)?.focus();
    });
  };

  const priceText = (id: ServiceId) => {
    const parts = illustrativeParts(getService(id).pricing, lang);
    return parts ? t('build.pricingIllustrative', parts) : t('common.quoteBased');
  };

  return (
    <aside className="panel build-sum" aria-labelledby="build-sum-title">
      <header className="build-sum__head">
        <div>
          <p className="telemetry" aria-hidden="true">
            SG//REQUEST
          </p>
          <h3 id="build-sum-title" ref={titleRef} tabIndex={-1} className="build-sum__title">
            {t('build.summaryTitle')}
          </h3>
        </div>
        <span className="badge badge--teal">{t('build.summaryCount', { count: total })}</span>
      </header>

      {total === 0 ? (
        <div className="build-empty" data-lenis-prevent>
          <span className="build-empty__icon" aria-hidden="true">
            <Blocks />
          </span>
          <p className="build-empty__title">{t('build.emptyTitle')}</p>
          <p className="build-empty__body">{t('build.emptyBody')}</p>
          <ul className="build-empty__links">
            <li>
              <a className="chip" href={`#${SECTION_IDS.catalog}`}>
                <LayoutGrid aria-hidden="true" />
                {t('build.emptyCatalog')}
              </a>
            </li>
            <li>
              <a className="chip" href={`#${SECTION_IDS.quiz}`}>
                <Compass aria-hidden="true" />
                {t('build.emptyQuiz')}
              </a>
            </li>
            <li>
              <a className="chip" href={`#${SECTION_IDS.packages}`}>
                <ListChecks aria-hidden="true" />
                {t('build.emptyPackages')}
              </a>
            </li>
          </ul>
        </div>
      ) : (
        <div className="build-sum__body" data-lenis-prevent>
          {pkg ? (
            <div className="build-pkg">
              <div className="build-pkg__head">
                <span className="build-row__icon build-row__icon--pkg" aria-hidden="true">
                  <PackageCheck />
                </span>
                <div className="build-row__text">
                  <span className="build-row__kind">{t('build.packageLabel')}</span>
                  <span className="build-row__name">{loc(pkg.name)}</span>
                  <span className="build-row__meta">
                    {t('build.packageIncludes', { count: pkg.includes.length })} · {t('common.quoteBased')}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--ghost btn--icon btn--sm build-row__remove"
                  ref={(el) => {
                    if (el) removeRefs.current.set('package', el);
                    else removeRefs.current.delete('package');
                  }}
                  aria-label={t('build.removeService', { name: loc(pkg.name) })}
                  onClick={() => removeAndRefocus('package', () => selectPackage(null))}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <ul className="build-pkg__includes">
                {pkg.includes.map((id) => {
                  const s = getService(id);
                  return (
                    <li key={id}>
                      <ServiceIcon name={s.icon} />
                      <span>{loc(s.name)}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}

          {serviceIds.length > 0 ? (
            <div className="build-services">
              <h4 className="build-sum__label">{t('build.servicesLabel')}</h4>
              <ul className="build-services__list">
                {serviceIds.map((id) => {
                  const s = getService(id);
                  return (
                    <li key={id} className="build-row">
                      <span className="build-row__icon" aria-hidden="true">
                        <ServiceIcon name={s.icon} />
                      </span>
                      <div className="build-row__text">
                        <span className="build-row__name">{loc(s.name)}</span>
                        <span className="build-row__meta">{priceText(id)}</span>
                        {s.requiresAuthorization ? (
                          <span className="build-row__auth">
                            <ShieldAlert aria-hidden="true" />
                            {t('common.authorizationRequired')}
                          </span>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="btn btn--ghost btn--icon btn--sm build-row__remove"
                        ref={(el) => {
                          if (el) removeRefs.current.set(id, el);
                          else removeRefs.current.delete(id);
                        }}
                        aria-label={t('build.removeService', { name: loc(s.name) })}
                        onClick={() => removeAndRefocus(id, () => removeServiceFromRequest(id))}
                      >
                        <X aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      )}

      <footer className="build-sum__foot">
        <button type="button" className="btn btn--secondary" onClick={() => useUI.getState().openBasket()}>
          <Pencil aria-hidden="true" />
          {t('build.edit')}
        </button>
        <button type="button" className="btn btn--primary" onClick={() => scrollToId(SECTION_IDS.contact)}>
          {t('build.continue')}
          <ArrowRight aria-hidden="true" className="icon-flip" />
        </button>
      </footer>
    </aside>
  );
}
