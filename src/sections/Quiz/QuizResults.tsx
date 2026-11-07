// Quiz results: ranked recommendations with a one-sentence "why", the points behind each one,
// and the next steps (add / add all / book a consultation / start over).
import type { RefObject } from 'react';
import { CalendarCheck, Check, ChevronDown, Info, ListPlus, RotateCcw } from 'lucide-react';
import type { Lang, ServiceId } from '../../data/types';
import { getService } from '../../data/services';
import { useI18n, type TKey } from '../../i18n';
import { maxScoreFor, type QuizAnswers, type Recommendation } from '../../lib/quiz';
import { addServiceToRequest, runPrimaryAction } from '../../state/actions';
import { packageCovers, useBasket } from '../../state/basket';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { ServiceActions } from '../Layers/ServiceLink';
import { optLabel } from './options';

const WHY: Partial<Record<ServiceId, TKey>> = {
  'website-assessment': 'quiz.why_websiteAssessment',
  'ecommerce-review': 'quiz.why_ecommerceReview',
  'email-accounts': 'quiz.why_emailAccounts',
  awareness: 'quiz.why_awareness',
  'backup-recovery': 'quiz.why_backupRecovery',
  consultation: 'quiz.why_consultation',
  'monthly-review': 'quiz.why_monthlyReview',
  'personal-accounts': 'quiz.why_personalAccounts',
  'device-review': 'quiz.why_deviceReview',
  'privacy-review': 'quiz.why_privacyReview',
  'scam-awareness': 'quiz.why_scamAwareness',
};

const FALLBACK_WHY: Partial<Record<ServiceId, TKey>> = {
  consultation: 'quiz.fallback_consultation',
  'email-accounts': 'quiz.fallback_emailAccounts',
  'personal-accounts': 'quiz.fallback_personalAccounts',
  'scam-awareness': 'quiz.fallback_scamAwareness',
};

type Translate = (key: TKey, vars?: Record<string, string | number>) => string;

function listFormat(items: string[], lang: Lang): string {
  try {
    return new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(items);
  } catch {
    return items.join(', ');
  }
}

/** One sentence tied to the visitor's own answers (top two reasons). */
export function whySentence(rec: Recommendation, answers: QuizAnswers, t: Translate, lang: Lang): string {
  if (rec.fallback) return t(FALLBACK_WHY[rec.id] ?? 'quiz.fallback_consultation');
  if (rec.contributions.some((c) => c.answer === 'breadth')) {
    return t('quiz.why_monthlyReviewBreadth', { count: answers.assets.length });
  }
  const labels = rec.contributions.slice(0, 2).map((c) => t('quiz.quote', { label: t(optLabel(c.answer)) }));
  return t(WHY[rec.id] ?? 'quiz.why_consultation', { matches: listFormat(labels, lang) });
}

interface Props {
  recs: Recommendation[];
  answers: QuizAnswers;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onRestart: () => void;
}

export function QuizResults({ recs, answers, headingRef, onRestart }: Props) {
  const { t, loc, lang } = useI18n();
  const type = answers.type ?? 'business';
  const isIndividual = type === 'individual';
  const serviceIds = useBasket((s) => s.serviceIds);
  const packageId = useBasket((s) => s.packageId);
  const pending = recs.filter((r) => !serviceIds.includes(r.id) && !packageCovers(packageId, r.id));
  const allIn = pending.length === 0;

  const basedOn = [
    t(optLabel(type)),
    ...answers.assets.map((id) => t(optLabel(id))),
    ...answers.concerns.map((id) => t(optLabel(id))),
  ];

  return (
    <div className="quiz-results">
      <header className="quiz-results__head">
        <p className="eyebrow">{t('quiz.resultsEyebrow')}</p>
        <h3 className="quiz-results__title" ref={headingRef} tabIndex={-1}>
          {t('quiz.resultsTitle')}
        </h3>
        <p className="quiz-results__lead">{t('quiz.resultsLead')}</p>
        <div className="quiz-basedon">
          <span className="quiz-tm">{t('quiz.basedOn')}</span>
          <ul>
            {basedOn.map((label) => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </div>
        <p className="sr-only" aria-live="polite">
          {t('quiz.resultCount', { count: recs.length })}
        </p>
      </header>

      <ol className="quiz-recs">
        {recs.map((rec, i) => {
          const service = getService(rec.id);
          const max = maxScoreFor(type, rec.id);
          const pct = rec.fallback ? 0 : Math.round((rec.score / max) * 100);
          return (
            <li key={rec.id} className="quiz-rec card" data-rank={i + 1} style={{ ['--i' as string]: i }}>
              <div className="quiz-rec__top">
                <span className="quiz-rec__rank" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="quiz-rec__icon" aria-hidden="true">
                  <ServiceIcon name={service.icon} />
                </span>
                <div className="quiz-rec__title">
                  {(i === 0 || rec.fallback) && (
                    <span className={`badge ${rec.fallback ? '' : 'badge--teal'}`}>
                      {rec.fallback ? t('quiz.startingPoint') : t('quiz.bestMatch')}
                    </span>
                  )}
                  <h4 className="quiz-rec__name">{loc(service.name)}</h4>
                </div>
              </div>

              <p className="quiz-rec__why">{whySentence(rec, answers, t, lang)}</p>

              {!rec.fallback && (
                <div className="quiz-rec__score">
                  <div className="quiz-rec__meter" aria-hidden="true">
                    <span style={{ width: `${pct}%` }} />
                  </div>
                  <span className="quiz-tm quiz-tm--code" aria-hidden="true">
                    {t('quiz.scoreShort', { score: rec.score, max })}
                  </span>
                  <span className="sr-only">{t('quiz.scoreLabel', { score: rec.score, max })}</span>
                  <ul className="quiz-rec__chips" aria-label={t('quiz.matchedLabel')}>
                    {rec.contributions.map((c) => (
                      <li key={c.answer}>
                        {t(optLabel(c.answer))}
                        <b dir="ltr">{t('quiz.points', { n: c.points })}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <ServiceActions id={rec.id} />
            </li>
          );
        })}
      </ol>

      <div className="quiz-results__foot">
        {isIndividual ? (
          <div className="quiz-book">
            <button type="button" className="btn btn--primary btn--lg" onClick={() => runPrimaryAction(recs[0].id)}>
              <CalendarCheck aria-hidden="true" />
              {t('quiz.bookPath')}
            </button>
            <p className="quiz-book__note">{t('quiz.bookPathNote')}</p>
          </div>
        ) : (
          <button
            type="button"
            className={`btn btn--lg ${allIn ? 'btn--secondary' : 'btn--primary'}`}
            aria-disabled={allIn}
            onClick={() => {
              if (!allIn) pending.forEach((r) => addServiceToRequest(r.id));
            }}
          >
            {allIn ? <Check aria-hidden="true" /> : <ListPlus aria-hidden="true" />}
            {allIn ? t('quiz.allAdded') : t('quiz.addAll')}
          </button>
        )}
        <button type="button" className="btn btn--secondary btn--lg" onClick={onRestart}>
          <RotateCcw aria-hidden="true" />
          {t('quiz.startOver')}
        </button>
      </div>

      <details className="quiz-how">
        <summary>
          <Info aria-hidden="true" />
          {t('quiz.howTitle')}
          <ChevronDown className="quiz-how__chev" aria-hidden="true" />
        </summary>
        <p>{t('quiz.howBody')}</p>
      </details>

      <p className="quiz-guidance quiz-guidance--foot">
        <Info aria-hidden="true" />
        {t('quiz.guidance')}
      </p>
    </div>
  );
}
