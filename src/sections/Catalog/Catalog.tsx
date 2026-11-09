// SERVICE CATALOG (#catalog) — the main functional storefront, normal scrolling.
// Filters live in the shared useCatalog store so nav links, the quiz and the constellation can preset them.
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import type { Audience, CategoryId, Service } from '../../data/types';
import { SERVICES, servicesFor } from '../../data/services';
import { categoriesFor } from '../../data/categories';
import { formatNumber, useI18n, type TKey } from '../../i18n';
import { hasQuery as queryHasTokens, searchServices } from '../../lib/search';
import { scheduleRefresh } from '../../lib/smoothScroll';
import { useCatalog } from '../../state/catalog';
import { useBasketCount } from '../../state/basket';
import { useUI } from '../../state/ui';
import { AudienceSwitch, CategoryChips } from './CatalogFilters';
import { SearchBox } from './SearchBox';
import { ServiceCard } from './ServiceCard';
import { CatalogEmpty } from './CatalogEmpty';
import { FeaturedServices } from './FeaturedServices';
import './Catalog.css';

export interface CatalogProps {
  /** Store pages: product details open as a page (e.g. /products/website-assessment) instead of the dialog. */
  detailsHref?: (id: Service['id']) => string;
  /** Store pages: the basket button links to the cart page instead of opening the drawer. */
  cartHref?: string;
  /** Heading level of the catalog title (h1 on the Products page, h2 inside the home experience). */
  titleAs?: 'h1' | 'h2';
  /** Home: show the Featured services block above the full catalog. */
  showFeatured?: boolean;
  /** Home: link to the full store page. */
  storeHref?: string;
}

const SUGGESTION_KEYS: TKey[] = ['catalog.suggest1', 'catalog.suggest2', 'catalog.suggest3', 'catalog.suggest4'];

/** Announces after typing settles, so screen readers are not flooded on every keystroke. */
function useSettled<T>(value: T, delay = 450): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setSettled(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return settled;
}

export function Catalog({ detailsHref, cartHref, titleAs: Title = 'h2', showFeatured = false, storeHref }: CatalogProps = {}) {
  const { t, lang } = useI18n();
  const audience = useCatalog((s) => s.audience);
  const category = useCatalog((s) => s.category);
  const query = useCatalog((s) => s.query);
  const setAudience = useCatalog((s) => s.setAudience);
  const setCategory = useCatalog((s) => s.setCategory);
  const setQuery = useCatalog((s) => s.setQuery);
  const basketCount = useBasketCount();
  // Telemetry codes (SVC-01…) follow the database display order.
  const catalogIndex = useMemo(() => new Map(SERVICES.map((s, i) => [s.id, i + 1])), []);

  const searching = queryHasTokens(query);
  const otherAudience: Audience = audience === 'business' ? 'personal' : 'business';

  // Matches per audience (all categories) — drive the segmented counts and the "switch" hints.
  const matches = useMemo<Record<Audience, Service[]>>(
    () => ({
      business: searchServices(servicesFor('business'), query, lang),
      personal: searchServices(servicesFor('personal'), query, lang),
    }),
    [query, lang],
  );
  const inAudience = matches[audience];
  const results = useMemo(
    () => (category === 'all' ? inAudience : inAudience.filter((s) => s.category === category)),
    [inAudience, category],
  );

  const categories = useMemo(() => categoriesFor(audience), [audience]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<CategoryId | 'all', number>([['all', inAudience.length]]);
    for (const c of categories) counts.set(c.id, 0);
    for (const s of inAudience) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    return counts;
  }, [inAudience, categories]);

  // Only suggest searches that actually find something for this audience.
  const suggestions = useMemo(
    () => SUGGESTION_KEYS.map((k) => t(k)).filter((s) => searchServices(servicesFor(audience), s, lang).length > 0),
    [t, audience, lang],
  );

  // Filtering changes the page height → re-measure the scroll model.
  const resultKey = results.map((s) => s.id).join(',');
  useEffect(() => scheduleRefresh(), [resultKey, audience, category]);

  const count = results.length;
  const countText =
    count === 0 ? t('catalog.resultsNone') : count === 1 ? t('catalog.resultsOne') : t('catalog.resultsMany', { count: formatNumber(count, lang) });
  const audienceWord = (a: Audience) => t(a === 'business' ? 'catalog.audienceWordBusiness' : 'catalog.audienceWordPersonal');

  const announcement = useSettled(
    count === 0
      ? t('catalog.announceNone', { audience: audienceWord(audience) })
      : count === 1
        ? t('catalog.announceOne', { audience: audienceWord(audience) })
        : t('catalog.announceMany', { count, audience: audienceWord(audience) }),
  );

  const otherCount = searching ? matches[otherAudience].length : 0;

  return (
    <section id="catalog" className="section cat" aria-labelledby="catalog-title">
      <div className="container">
        <header className="section-head cat-head">
          <div className="cat-head__eyebrows">
            <span className="eyebrow">{t('catalog.eyebrow')}</span>
            <span className="telemetry" aria-hidden="true">
              {t('catalog.telemetry', { count: SERVICES.length })}
            </span>
          </div>
          <Title id="catalog-title" className="h2">
            {t('catalog.title')}
          </Title>
          <p className="lead">{t('catalog.lead')}</p>
          {storeHref ? (
            <p className="cat-head__store">
              <Link className="btn btn--link" href={storeHref}>
                {t('shop.storeLink')}
                <ArrowRight className="icon-flip" aria-hidden="true" />
              </Link>
            </p>
          ) : null}
        </header>

        {showFeatured ? <FeaturedServices detailsHref={detailsHref ?? ((id) => `/products/${id}`)} /> : null}

        <div className="cat-toolbar panel" role="search" aria-label={t('catalog.toolbarLabel')}>
          <div className="cat-toolbar__row">
            <AudienceSwitch
              value={audience}
              counts={{ business: matches.business.length, personal: matches.personal.length }}
              onChange={setAudience}
            />
            <SearchBox value={query} onChange={setQuery} controls="catalog-results" describedBy="catalog-count" />
          </div>
          <CategoryChips categories={categories} value={category} counts={categoryCounts} onChange={setCategory} />
        </div>

        <div className="cat-resultbar">
          <p id="catalog-count" className="cat-resultbar__count">
            <span className="cat-resultbar__dot" aria-hidden="true" data-none={count === 0 ? 'true' : undefined} />
            <span>{countText}</span>
            {searching ? (
              <>
                {' '}
                <span className="cat-resultbar__query">{t('catalog.resultsFor', { query: query.trim() })}</span>
              </>
            ) : null}
          </p>
          {searching && count > 0 && otherCount > 0 ? (
            <p className="cat-resultbar__other">
              <span>{t('catalog.alsoOther', { count: otherCount, audience: audienceWord(otherAudience) })}</span>
              <button type="button" className="btn btn--link btn--sm" onClick={() => setAudience(otherAudience)}>
                {t('catalog.alsoOtherShow')}
              </button>
            </p>
          ) : null}
          {cartHref ? (
            <Link className="btn btn--secondary btn--sm cat-resultbar__basket" href={cartHref}>
              <ShoppingBag aria-hidden="true" />
              {basketCount > 0 ? t('catalog.viewRequestCount', { count: basketCount }) : t('catalog.viewRequest')}
            </Link>
          ) : (
            <button type="button" className="btn btn--secondary btn--sm cat-resultbar__basket" onClick={() => useUI.getState().openBasket()}>
              <ShoppingBag aria-hidden="true" />
              {basketCount > 0 ? t('catalog.viewRequestCount', { count: basketCount }) : t('catalog.viewRequest')}
            </button>
          )}
        </div>
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>

        <div id="catalog-results" className="cat-results" aria-label={t('catalog.gridLabel')} role="region">
          {count > 0 ? (
            <ul className="cat-grid">
              {results.map((service) => (
                <li key={service.id} className="cat-grid__item">
                  <ServiceCard service={service} index={catalogIndex.get(service.id) ?? 0} detailsHref={detailsHref?.(service.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <CatalogEmpty
              query={query}
              hasQuery={searching}
              allCategoriesCount={category === 'all' ? null : inAudience.length}
              otherAudience={otherAudience}
              otherCount={otherCount}
              suggestions={suggestions}
              onClear={() => setQuery('')}
              onAllCategories={() => setCategory('all')}
              onSwitchAudience={() => setAudience(otherAudience)}
              onSuggest={(s) => {
                setCategory('all');
                setQuery(s);
              }}
            />
          )}
        </div>

        <p className="cat-footnote">{t('catalog.footnote')}</p>
      </div>
    </section>
  );
}
