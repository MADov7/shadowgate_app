// OWNER: guidance agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Layers() {
  const { t } = useI18n();
  return (
    <section id="layers" className="scrolly" aria-labelledby="layers-title" style={{ ['--scrolly-h' as string]: '320vh' }}>
      <div className="scrolly__pin"><div className="container"><h2 id="layers-title" className="h2">{t('layers.title')}</h2></div></div>
    </section>
  );
}
