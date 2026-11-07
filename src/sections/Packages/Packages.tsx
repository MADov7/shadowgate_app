// PACKAGES (#packages) — three bundles + a real comparison table. Normal scrolling.
// Selecting a package goes through selectPackage() (duplicate merging + toast with undo).
import { CalendarCheck, Check, Columns3, Eye, Minus, Repeat, ShoppingBag, Sparkles } from 'lucide-react';
import type { L10n, PackageId, ServicePackage } from '../../data/types';
import { COMPARISON, PACKAGES } from '../../data/packages';
import { getService } from '../../data/services';
import { useI18n } from '../../i18n';
import { useBasket } from '../../state/basket';
import { selectPackage } from '../../state/actions';
import { useUI } from '../../state/ui';
import { scrollToId } from '../../lib/smoothScroll';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { trackSpotlight, usePricingText } from '../Catalog/commerce';
import './Packages.css';

const RECURRING: Record<PackageId, boolean> = { foundation: false, business: false, continuity: true };
/** Factual highlight: the one-time package that bundles the most services. */
const FEATURED: PackageId = 'business';

function filled(list: readonly string[]): string[] {
  return list.map((s) => s.trim()).filter(Boolean);
}

function SelectButton({ pkg, compact }: { pkg: ServicePackage; compact?: boolean }) {
  const { t } = useI18n();
  const selected = useBasket((s) => s.packageId === pkg.id);
  return (
    <button
      type="button"
      className={`btn ${selected ? 'btn--secondary pkg-btn-selected' : 'btn--primary'}${compact ? ' btn--sm' : ''}`}
      aria-pressed={selected}
      onClick={() => selectPackage(selected ? null : pkg.id)}
    >
      {selected ? <Check aria-hidden="true" /> : null}
      <span>{selected ? t('packages.selected') : t('packages.select')}</span>
    </button>
  );
}

function PackageCard({ pkg, index }: { pkg: ServicePackage; index: number }) {
  const { t, loc, locList } = useI18n();
  const selected = useBasket((s) => s.packageId === pkg.id);
  const pricing = usePricingText(pkg.pricing);
  const featured = pkg.id === FEATURED;
  const recurring = RECURRING[pkg.id];
  const highlights = filled(locList(pkg.highlights));
  const titleId = `pkg-title-${pkg.id}`;
  const tagline = loc(pkg.tagline);
  const bestFor = loc(pkg.bestFor);

  return (
    <article
      className={`card pkg-card${featured ? ' pkg-card--featured glow-border' : ''}`}
      data-selected={selected ? 'true' : undefined}
      aria-labelledby={titleId}
      onPointerMove={trackSpotlight}
    >
      <div className="pkg-card__top">
        <span className="telemetry" aria-hidden="true">
          {t('packages.cardCode', { n: String(index + 1).padStart(2, '0') })}
        </span>
        <span className="badge pkg-cadence" data-recurring={recurring ? 'true' : undefined}>
          {recurring ? <Repeat aria-hidden="true" /> : <CalendarCheck aria-hidden="true" />}
          {recurring ? t('packages.recurring') : t('packages.oneTime')}
        </span>
      </div>

      {featured || selected ? (
        <div className="pkg-card__flags">
          {featured ? (
            <span className="badge badge--teal pkg-flag">
              <Sparkles aria-hidden="true" />
              {t('packages.highlight')}
            </span>
          ) : null}
          {selected ? (
            <span className="badge pkg-flag pkg-flag--selected">
              <Check aria-hidden="true" />
              {t('packages.inRequest')}
            </span>
          ) : null}
        </div>
      ) : null}

      <header className="pkg-card__head">
        <h3 id={titleId} className="pkg-card__name">
          {loc(pkg.name)}
        </h3>
        {tagline ? <p className="pkg-card__tagline">{tagline}</p> : null}
      </header>

      {bestFor ? (
        <p className="pkg-card__best">
          <span className="pkg-label">{t('packages.bestFor')}</span>
          <span>{bestFor}</span>
        </p>
      ) : null}

      <div className="pkg-card__includes">
        <p className="pkg-label" id={`${titleId}-inc`}>
          {t('packages.includes')}
        </p>
        <ul aria-labelledby={`${titleId}-inc`}>
          {pkg.includes.map((sid) => {
            const service = getService(sid);
            const name = loc(service.name);
            return (
              <li key={sid}>
                <button
                  type="button"
                  className="pkg-svc"
                  onClick={() => useUI.getState().openDetails(sid)}
                  aria-label={t('packages.detailsLabel', { name })}
                >
                  <span className="pkg-svc__icon" aria-hidden="true">
                    <ServiceIcon name={service.icon} />
                  </span>
                  <span className="pkg-svc__name">{name}</span>
                  <Eye className="pkg-svc__eye" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {highlights.length > 0 ? (
        <ul className="list-check pkg-card__highlights">
          {highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      ) : null}

      <dl className="pkg-card__facts">
        <div>
          <dt>{t('packages.cadence')}</dt>
          <dd>{loc(pkg.cadence)}</dd>
        </div>
        <div>
          <dt>{t('packages.duration')}</dt>
          <dd>{loc(pkg.duration)}</dd>
        </div>
        <div>
          <dt>{t('packages.pricing')}</dt>
          <dd>{pricing.label}</dd>
        </div>
      </dl>

      <div className="pkg-card__actions">
        <SelectButton pkg={pkg} />
        <button type="button" className="btn btn--secondary" onClick={() => scrollToId('packages-compare')}>
          <Columns3 aria-hidden="true" />
          {t('packages.compare')}
        </button>
      </div>
      {selected ? (
        <button type="button" className="btn btn--link btn--sm pkg-card__open" onClick={() => useUI.getState().openBasket()}>
          <ShoppingBag aria-hidden="true" />
          {t('packages.openRequest')}
        </button>
      ) : null}
    </article>
  );
}

function CompareValue({ value }: { value: boolean | L10n }) {
  const { t, loc } = useI18n();
  if (value === true) {
    return (
      <span className="pkg-yes">
        <Check aria-hidden="true" />
        <span className="sr-only">{t('packages.yes')}</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="pkg-no">
        <Minus aria-hidden="true" />
        <span className="sr-only">{t('packages.no')}</span>
      </span>
    );
  }
  return <span className="pkg-text">{loc(value) || value.en}</span>;
}

function Comparison() {
  const { t, loc } = useI18n();
  const selectedId = useBasket((s) => s.packageId);
  return (
    <div className="pkg-compare" id="packages-compare">
      <div className="pkg-compare__head">
        <h3 className="pkg-compare__title" id="pkg-compare-title" data-focus-target>
          {t('packages.compareTitle')}
        </h3>
        <p className="pkg-compare__swipe" aria-hidden="true">
          {t('packages.compareSwipe')}
        </p>
      </div>
      {/* Scrollable region is focusable so keyboard users can scroll it on small screens. */}
      <div className="pkg-table-wrap" role="region" aria-label={t('packages.compareScroll')} tabIndex={0} data-lenis-prevent>
        <table className="pkg-table">
          <caption className="sr-only">{t('packages.compareCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('packages.compareFeature')}</th>
              {PACKAGES.map((p) => (
                <th key={p.id} scope="col" data-selected={selectedId === p.id ? 'true' : undefined} data-featured={p.id === FEATURED ? 'true' : undefined}>
                  <span className="pkg-table__pkg">{loc(p.name)}</span>
                  {selectedId === p.id ? (
                    <span className="pkg-table__sel">
                      <Check aria-hidden="true" />
                      {t('packages.selectedColumn')}
                    </span>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARISON.map((row) => (
              <tr key={row.id}>
                <th scope="row">{loc(row.label) || row.label.en}</th>
                {PACKAGES.map((p) => (
                  <td key={p.id} data-selected={selectedId === p.id ? 'true' : undefined}>
                    <CompareValue value={row.values[p.id]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th scope="row">
                <span className="sr-only">{t('packages.select')}</span>
              </th>
              {PACKAGES.map((p) => (
                <td key={p.id} data-selected={selectedId === p.id ? 'true' : undefined}>
                  <SelectButton pkg={p} compact />
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export function Packages() {
  const { t } = useI18n();
  return (
    <section id="packages" className="section pkg" aria-labelledby="packages-title">
      <div className="container">
        <header className="section-head pkg-head">
          <div className="pkg-head__eyebrows">
            <span className="eyebrow">{t('packages.eyebrow')}</span>
            <span className="telemetry" aria-hidden="true">
              {t('packages.telemetry')}
            </span>
          </div>
          <h2 id="packages-title" className="h2">
            {t('packages.title')}
          </h2>
          <p className="lead">{t('packages.lead')}</p>
        </header>

        <ul className="pkg-grid">
          {PACKAGES.map((pkg, index) => (
            <li key={pkg.id} className="pkg-grid__item">
              <PackageCard pkg={pkg} index={index} />
            </li>
          ))}
        </ul>

        <Comparison />

        <div className="pkg-notes">
          <p className="pkg-note">{t('packages.pricingNote')}</p>
          <p className="pkg-note">{t('packages.monthlyNote')}</p>
          <a className="btn btn--ghost pkg-quiz" href="#quiz">
            <Sparkles aria-hidden="true" />
            {t('packages.quizCta')}
          </a>
        </div>
      </div>
    </section>
  );
}
