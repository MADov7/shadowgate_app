// Static experience (no WebGL or reduced motion): the same eight services as an accessible, attractive grid —
// no hotspots, no drag, no scroll-scrubbed motion. A still SVG constellation keeps the visual identity.
import type { CSSProperties } from 'react';
import { BUSINESS_SERVICE_IDS, getService } from '../../data/services';
import { categoryById } from '../../data/categories';
import { useI18n } from '../../i18n';
import { SCROLLY_HEIGHT } from '../../lib/choreo';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { ServiceActions, pad2, pricingLabel, useMedia } from './shared';

/** Decorative still of the constellation: a spine with eight faceted nodes zig-zagging down it. */
function ConstellationArt() {
  const nodes = BUSINESS_SERVICE_IDS.map((_, i) => ({ x: 120 + (i % 2 === 0 ? -46 : 46), y: 26 + i * 40 }));
  const hex = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const a = (Math.PI / 3) * k + Math.PI / 6;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');
  return (
    <svg className="cst-art" viewBox="0 0 240 340" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="cst-art-glow">
          <stop offset="0" stopColor="var(--sg-teal)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--sg-teal)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <line x1="120" y1="4" x2="120" y2="336" stroke="var(--sg-teal)" strokeOpacity="0.35" strokeWidth="1" />
      {nodes.map((n, i) => (
        <g key={i}>
          <line x1="120" y1={n.y} x2={n.x} y2={n.y} stroke="var(--sg-teal)" strokeOpacity="0.3" />
          {i === 1 ? <circle cx={n.x} cy={n.y} r="30" fill="url(#cst-art-glow)" /> : null}
          <polygon
            points={hex(n.x, n.y, i === 1 ? 15 : 11)}
            fill="var(--sg-navy-3)"
            stroke={i === 1 ? 'var(--sg-teal)' : 'rgba(243,246,250,0.35)'}
            strokeWidth="1.2"
          />
          <polygon points={hex(n.x, n.y, i === 1 ? 5 : 3.5)} fill="var(--sg-teal)" fillOpacity={i === 1 ? 1 : 0.55} />
        </g>
      ))}
    </svg>
  );
}

export function ConstellationStatic() {
  const { t, loc, lang } = useI18n();
  const narrow = useMedia('(max-width: 819px)');
  const height = narrow ? SCROLLY_HEIGHT.constellation.mobile : SCROLLY_HEIGHT.constellation.desktop;
  return (
    <section
      id="explore"
      className="scrolly cst cst--static"
      aria-labelledby="explore-title"
      style={{ '--scrolly-h': height } as CSSProperties}
    >
      <div className="scrolly__pin">
        <div className="container section cst-static">
          <div className="cst-static__head">
            <header className="section-head">
              <p className="eyebrow">{t('constellation.eyebrow')}</p>
              <h2 id="explore-title" className="h2">
                {t('constellation.title')}
              </h2>
              <p className="lead">{t('constellation.staticLead')}</p>
              <a className="cst-skip cst-skip--static" href="#catalog">
                {t('common.skipSequence')}
              </a>
            </header>
            <ConstellationArt />
          </div>
          <ol className="cst-grid" aria-label={t('constellation.gridLabel')}>
            {BUSINESS_SERVICE_IDS.map((id, i) => {
              const service = getService(id);
              return (
                <li key={id}>
                  <article className="card cst-card" aria-labelledby={`cst-card-${id}`}>
                    <div className="cst-card__top">
                      <span className="cst-card__icon" aria-hidden="true">
                        <ServiceIcon name={service.icon} />
                      </span>
                      <span className="telemetry">{pad2(i + 1)} / {pad2(BUSINESS_SERVICE_IDS.length)}</span>
                    </div>
                    <span className="badge badge--teal cst-card__cat">{loc(categoryById(service.category).label)}</span>
                    <h3 id={`cst-card-${id}`} className="cst-card__name">
                      {loc(service.name)}
                    </h3>
                    <p className="cst-card__benefit">{loc(service.benefit)}</p>
                    <dl className="cst-card__meta">
                      <div>
                        <dt>{t('constellation.durationShort')}</dt>
                        <dd>{loc(service.duration)}</dd>
                      </div>
                      <div>
                        <dt>{t('constellation.pricingShort')}</dt>
                        <dd>{pricingLabel(service, t, lang)}</dd>
                      </div>
                    </dl>
                    {service.requiresAuthorization ? (
                      <p className="cst-auth cst-auth--card">{t('common.authorizationRequired')}</p>
                    ) : null}
                    <ServiceActions id={id} compact />
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
