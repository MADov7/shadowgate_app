// OWNER: guidance agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Simulation() {
  const { t } = useI18n();
  return (
    <section id="simulation" className="section" aria-labelledby="simulation-title">
      <div className="container"><h2 id="simulation-title" className="h2">{t('simulation.title')}</h2></div>
    </section>
  );
}
