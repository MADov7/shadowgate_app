// Audience segmented control + category chips. Both are toggle-button groups (aria-pressed) with
// counts that follow the current search, so visitors can see where matches are before switching.
import { Building2, LayoutGrid, UserRound } from 'lucide-react';
import type { Audience, Category, CategoryId } from '../../data/types';
import { useI18n } from '../../i18n';

interface AudienceSwitchProps {
  value: Audience;
  counts: Record<Audience, number>;
  onChange: (audience: Audience) => void;
}

const AUDIENCES: ReadonlyArray<{ id: Audience; icon: typeof Building2; label: 'catalog.audienceBusiness' | 'catalog.audiencePersonal' }> = [
  { id: 'business', icon: Building2, label: 'catalog.audienceBusiness' },
  { id: 'personal', icon: UserRound, label: 'catalog.audiencePersonal' },
];

export function AudienceSwitch({ value, counts, onChange }: AudienceSwitchProps) {
  const { t } = useI18n();
  return (
    <div className="cat-audience">
      <span className="cat-filter-label" id="catalog-audience-label">
        {t('catalog.audienceLabel')}
      </span>
      <div className="segmented cat-segmented" role="group" aria-labelledby="catalog-audience-label">
        {AUDIENCES.map(({ id, icon: Icon, label }) => (
          <button key={id} type="button" aria-pressed={value === id} onClick={() => value !== id && onChange(id)}>
            <Icon aria-hidden="true" />
            <span>{t(label)}</span>
            <span className="cat-count" aria-hidden="true">
              {counts[id]}
            </span>
            <span className="sr-only">, {t('catalog.audienceCount', { count: counts[id] })}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface CategoryChipsProps {
  categories: Category[];
  value: CategoryId | 'all';
  counts: Map<CategoryId | 'all', number>;
  onChange: (category: CategoryId | 'all') => void;
}

export function CategoryChips({ categories, value, counts, onChange }: CategoryChipsProps) {
  const { t, loc } = useI18n();
  const items: Array<{ id: CategoryId | 'all'; label: string }> = [
    { id: 'all', label: t('catalog.categoryAll') },
    ...categories.map((c) => ({ id: c.id, label: loc(c.label) })),
  ];
  return (
    <div className="cat-categories">
      <span className="cat-filter-label" id="catalog-category-label">
        {t('catalog.categoryLabel')}
      </span>
      <div className="cat-chips" role="group" aria-labelledby="catalog-category-label">
        {items.map((item) => {
          const count = counts.get(item.id) ?? 0;
          return (
            <button
              key={item.id}
              type="button"
              className="chip cat-chip"
              aria-pressed={value === item.id}
              data-empty={count === 0 ? 'true' : undefined}
              onClick={() => onChange(item.id)}
            >
              {item.id === 'all' ? <LayoutGrid aria-hidden="true" /> : null}
              <span>{item.label}</span>
              <span className="cat-count" aria-hidden="true">
                {count}
              </span>
              <span className="sr-only">, {t('catalog.categoryCount', { count })}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
