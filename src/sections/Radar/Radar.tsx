// OWNER: radar agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Radar() {
  const { t } = useI18n();
  return (
    <section id="radar" className="scrolly" aria-labelledby="radar-title" style={{ ['--scrolly-h' as string]: '230vh' }}>
      <div className="scrolly__pin"><div className="container"><h2 id="radar-title" className="h2">{t('radar.title')}</h2></div></div>
    </section>
  );
}
