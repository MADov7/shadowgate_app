// OWNER: guidance agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Quiz() {
  const { t } = useI18n();
  return (
    <section id="quiz" className="section" aria-labelledby="quiz-title">
      <div className="container"><h2 id="quiz-title" className="h2">{t('quiz.title')}</h2></div>
    </section>
  );
}
