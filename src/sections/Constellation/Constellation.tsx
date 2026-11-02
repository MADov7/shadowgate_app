// OWNER: world-scenes agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Constellation() {
  const { t } = useI18n();
  return (
    <section id="explore" className="scrolly" aria-labelledby="explore-title" style={{ ['--scrolly-h' as string]: '300vh' }}>
      <div className="scrolly__pin"><div className="container"><h2 id="explore-title" className="h2">{t('constellation.title')}</h2></div></div>
    </section>
  );
}
