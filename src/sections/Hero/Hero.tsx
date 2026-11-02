// OWNER: welcome-hero agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Hero() {
  const { t } = useI18n();
  return (
    <section id="home" className="section" aria-labelledby="home-title">
      <div className="container"><h2 id="home-title" className="h2">{t('hero.title')}</h2></div>
    </section>
  );
}
