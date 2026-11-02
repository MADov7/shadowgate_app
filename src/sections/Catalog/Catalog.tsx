// OWNER: commerce agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Catalog() {
  const { t } = useI18n();
  return (
    <section id="catalog" className="section" aria-labelledby="catalog-title">
      <div className="container"><h2 id="catalog-title" className="h2">{t('catalog.title')}</h2></div>
    </section>
  );
}
