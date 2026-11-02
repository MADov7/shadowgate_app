// OWNER: commerce agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Packages() {
  const { t } = useI18n();
  return (
    <section id="packages" className="section" aria-labelledby="packages-title">
      <div className="container"><h2 id="packages-title" className="h2">{t('packages.title')}</h2></div>
    </section>
  );
}
