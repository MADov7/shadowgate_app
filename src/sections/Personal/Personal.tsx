// Scene F (part 1) — Individuals. Approachable intro, the four personal services, and plain reassurance:
// sessions are guided, devices are never accessed without the person, nothing is scanned remotely.
import { useRef } from 'react';
import { CalendarCheck, Footprints, HandHeart, ListChecks, ScanEye, Video } from 'lucide-react';
import { useI18n, type TKey } from '../../i18n';
import { servicesFor } from '../../data/services';
import { SECTION_IDS } from '../../lib/choreo';
import { useSectionProgress } from '../../lib/useSectionProgress';
import { useExperience } from '../../state/experience';
import { PersonalServiceCard } from './PersonalServiceCard';
import './Personal.css';

const REASSURE: ReadonlyArray<{ icon: typeof HandHeart; title: TKey; body: TKey }> = [
  { icon: Footprints, title: 'personal.reassure1Title', body: 'personal.reassure1Body' },
  { icon: HandHeart, title: 'personal.reassure2Title', body: 'personal.reassure2Body' },
  { icon: ScanEye, title: 'personal.reassure3Title', body: 'personal.reassure3Body' },
];

const FLOW: ReadonlyArray<{ icon: typeof HandHeart; label: TKey }> = [
  { icon: CalendarCheck, label: 'personal.flow1' },
  { icon: Video, label: 'personal.flow2' },
  { icon: ListChecks, label: 'personal.flow3' },
];

export function Personal() {
  const { t } = useI18n();
  const services = servicesFor('personal');
  const ref = useRef<HTMLElement>(null);
  const isStatic = useExperience((s) => s.mode === 'static');

  // Reversible entrance: cards rise into place as the section scrolls up (scrubbed, not a one-shot fade).
  useSectionProgress(ref, (p) => ref.current?.style.setProperty('--per-p', p.toFixed(4)), {
    start: 'top bottom',
    end: 'top 25%',
    enabled: !isStatic,
  });

  return (
    <section id={SECTION_IDS.personal} ref={ref} className="section per" aria-labelledby="personal-title">
      <div className="container">
        <header className="section-head per__head">
          <p className="eyebrow">{t('personal.eyebrow')}</p>
          <h2 id="personal-title" className="h2">
            {t('personal.title')}
          </h2>
          <p className="lead">{t('personal.lead')}</p>
        </header>

        <ul className="per__grid" aria-label={t('personal.listLabel')}>
          {services.map((service, i) => (
            <li key={service.id} className="per__item" style={{ ['--i' as string]: i }}>
              <PersonalServiceCard service={service} index={i + 1} total={services.length} />
            </li>
          ))}
        </ul>

        <div className="per__assure">
          <div className="per__assure-col">
            <h3 className="per__assure-title">{t('personal.reassureTitle')}</h3>
            <ul className="per-assure">
              {REASSURE.map(({ icon: Icon, title, body }) => (
                <li key={title} className="per-assure__item">
                  <span className="per-assure__icon" aria-hidden="true">
                    <Icon />
                  </span>
                  <div>
                    <p className="per-assure__title">{t(title)}</p>
                    <p className="per-assure__body">{t(body)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="per__flow panel">
            <h3 className="per__assure-title">{t('personal.flowTitle')}</h3>
            <ol className="per-flow">
              {FLOW.map(({ icon: Icon, label }, i) => (
                <li key={label} className="per-flow__step">
                  <span className="per-flow__num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <Icon aria-hidden="true" className="per-flow__icon" />
                  <span>{t(label)}</span>
                </li>
              ))}
            </ol>
            <p className="per-flow__note">
              <span className="badge badge--demo">{t('common.demoBadge')}</span>
              {t('personal.flowNote')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
