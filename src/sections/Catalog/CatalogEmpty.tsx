// Useful empty state: says why nothing matches and offers every way forward
// (clear search, widen category, switch audience, take the quiz, or try a suggested search).
import { ArrowLeftRight, LayoutGrid, SearchX, Sparkles, X } from 'lucide-react';
import type { Audience } from '../../data/types';
import { useI18n } from '../../i18n';

interface CatalogEmptyProps {
  query: string;
  hasQuery: boolean;
  /** Matches across all categories of the current audience (shown when a category is active). */
  allCategoriesCount: number | null;
  otherAudience: Audience;
  otherCount: number;
  suggestions: string[];
  onClear: () => void;
  onAllCategories: () => void;
  onSwitchAudience: () => void;
  onSuggest: (query: string) => void;
}

export function CatalogEmpty({
  query,
  hasQuery,
  allCategoriesCount,
  otherAudience,
  otherCount,
  suggestions,
  onClear,
  onAllCategories,
  onSwitchAudience,
  onSuggest,
}: CatalogEmptyProps) {
  const { t } = useI18n();
  const audienceWord = t(otherAudience === 'business' ? 'catalog.audienceWordBusiness' : 'catalog.audienceWordPersonal');
  return (
    <div className="cat-empty panel">
      <span className="cat-empty__icon" aria-hidden="true">
        <SearchX />
      </span>
      <h3 className="cat-empty__title">
        {hasQuery ? t('catalog.emptyTitleQuery', { query: query.trim() }) : t('catalog.emptyTitle')}
      </h3>
      <p className="cat-empty__body">{t('catalog.emptyBody')}</p>

      <div className="cat-empty__actions">
        {hasQuery ? (
          <button type="button" className="btn btn--primary" onClick={onClear}>
            <X aria-hidden="true" />
            {t('catalog.emptyClear')}
          </button>
        ) : null}
        {allCategoriesCount !== null ? (
          <button type="button" className="btn btn--secondary" onClick={onAllCategories}>
            <LayoutGrid aria-hidden="true" />
            {allCategoriesCount > 0
              ? t('catalog.emptyAllCategoriesCount', { count: allCategoriesCount })
              : t('catalog.emptyAllCategories')}
          </button>
        ) : null}
        <button type="button" className="btn btn--secondary" onClick={onSwitchAudience}>
          <ArrowLeftRight aria-hidden="true" />
          {otherCount > 0
            ? t('catalog.emptySwitchCount', { audience: audienceWord, count: otherCount })
            : t('catalog.emptySwitch', { audience: audienceWord })}
        </button>
        <a className="btn btn--ghost" href="#quiz">
          <Sparkles aria-hidden="true" />
          {t('catalog.emptyQuiz')}
        </a>
      </div>

      {suggestions.length > 0 ? (
        <div className="cat-empty__suggest">
          <span className="cat-filter-label" id="catalog-suggest-label">
            {t('catalog.suggestionsLabel')}
          </span>
          <ul className="cat-empty__chips" aria-labelledby="catalog-suggest-label">
            {suggestions.map((s) => (
              <li key={s}>
                <button type="button" className="chip" onClick={() => onSuggest(s)}>
                  {s}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
