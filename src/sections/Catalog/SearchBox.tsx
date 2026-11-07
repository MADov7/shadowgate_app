// Labelled search field: magnifier icon, custom clear button, Escape clears (only when there is text,
// so Escape elsewhere keeps its usual meaning). Controls the results grid.
import { useRef, type KeyboardEvent } from 'react';
import { Search, X } from 'lucide-react';
import { useI18n } from '../../i18n';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  controls: string;
  describedBy?: string;
}

export function SearchBox({ value, onChange, controls, describedBy }: SearchBoxProps) {
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);

  const clear = () => {
    onChange('');
    input.current?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && value) {
      event.preventDefault();
      event.stopPropagation();
      onChange('');
    }
  };

  return (
    <div className="cat-search">
      <label className="cat-search__label" htmlFor="catalog-search">
        {t('catalog.searchLabel')}
      </label>
      <div className="cat-search__field" data-filled={value ? 'true' : 'false'}>
        <Search className="cat-search__icon" aria-hidden="true" />
        <input
          ref={input}
          id="catalog-search"
          className="input cat-search__input"
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          placeholder={t('catalog.searchPlaceholder')}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          aria-controls={controls}
          aria-describedby={describedBy ? `${describedBy} catalog-search-hint` : 'catalog-search-hint'}
        />
        {value ? (
          <button type="button" className="cat-search__clear" onClick={clear} aria-label={t('catalog.searchClear')}>
            <X aria-hidden="true" />
          </button>
        ) : null}
      </div>
      <span id="catalog-search-hint" className="sr-only">
        {t('catalog.searchHint')}
      </span>
    </div>
  );
}
