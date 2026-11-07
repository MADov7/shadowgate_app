// Interaction E — Recommendation Quiz. Three questions → 2–4 ranked services, scored transparently by
// src/lib/quiz.ts. Guidance only: results explain which answers led to each suggestion and never claim risk.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useI18n, type TKey } from '../../i18n';
import {
  ASSET_OPTIONS,
  CONCERN_OPTIONS,
  CUSTOMER_TYPES,
  EMPTY_ANSWERS,
  QUESTION_COUNT,
  isQuestionAnswered,
  recommend,
  setCustomerType,
  toggleConcern,
  toggleItem,
  type AssetId,
  type ConcernId,
  type QuizAnswers,
} from '../../lib/quiz';
import { QuizResults } from './QuizResults';
import { OPTION_ICON, optDesc, optLabel, type OptionId } from './options';
import { getLenis } from '../../lib/smoothScroll';
import './Quiz.css';

const QUESTIONS: ReadonlyArray<{ title: TKey; hint: TKey; short: TKey }> = [
  { title: 'quiz.q1Title', hint: 'quiz.q1Hint', short: 'quiz.q1Short' },
  { title: 'quiz.q2Title', hint: 'quiz.q2Hint', short: 'quiz.q2Short' },
  { title: 'quiz.q3Title', hint: 'quiz.q3Hint', short: 'quiz.q3Short' },
];

export function Quiz() {
  const { t } = useI18n();
  /** 0..2 = question, 3 = results. */
  const [q, setQ] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(EMPTY_ANSWERS);
  const [error, setError] = useState(false);
  const focusNext = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const resultsRef = useRef<HTMLHeadingElement>(null);
  const showResults = q >= QUESTION_COUNT;
  const recs = useMemo(() => (showResults ? recommend(answers) : []), [showResults, answers]);

  // Move focus to the new question / results heading after a user-initiated step change.
  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    (showResults ? resultsRef.current : headingRef.current)?.focus({ preventScroll: true });
    // Keep the question in view when the previous one was long (mobile).
    const shell = document.getElementById('quiz-shell');
    if (shell && shell.getBoundingClientRect().top < 0) {
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(shell, { offset: -96, duration: 0.8 });
      else shell.scrollIntoView({ block: 'start' });
    }
  }, [q, showResults]);

  const goTo = (next: number) => {
    setError(false);
    focusNext.current = true;
    setQ(next);
  };
  const onNext = () => {
    if (!isQuestionAnswered(q, answers)) {
      setError(true);
      return;
    }
    goTo(q + 1);
  };
  const restart = () => {
    setAnswers(EMPTY_ANSWERS);
    goTo(0);
  };

  const type = answers.type;
  const progressStep = showResults ? QUESTION_COUNT : q + 1;
  const errorId = 'quiz-error';

  const answerSummary = (i: number): string => {
    if (i === 0) return type ? t(optLabel(type)) : '';
    const list: OptionId[] = i === 1 ? answers.assets : answers.concerns;
    return list.map((id) => t(optLabel(id))).join(' · ');
  };

  return (
    <section id="quiz" className="section quiz" aria-labelledby="quiz-title">
      <div className="container">
        <header className="section-head quiz-head">
          <p className="eyebrow">{t('quiz.eyebrow')}</p>
          <h2 id="quiz-title" className="h2">
            {t('quiz.title')}
          </h2>
          <p className="lead">{t('quiz.lead')}</p>
          <p className="quiz-guidance">
            <Info aria-hidden="true" />
            {t('quiz.guidance')}
          </p>
        </header>

        <div id="quiz-shell" className="quiz-shell panel">
          {/* Progress + answers summary */}
          <aside className="quiz-aside">
            <div className="quiz-progress">
              <div className="quiz-progress__row">
                <span className="quiz-tm quiz-tm--code" aria-hidden="true">
                  {t('quiz.telemetry')}
                </span>
                <span className="quiz-progress__text">
                  {showResults ? t('quiz.resultsEyebrow') : t('quiz.progress', { n: q + 1, total: QUESTION_COUNT })}
                </span>
              </div>
              <div
                className="quiz-progress__bar"
                role="progressbar"
                aria-label={t('quiz.progressLabel')}
                aria-valuemin={0}
                aria-valuemax={QUESTION_COUNT}
                aria-valuenow={progressStep}
                aria-valuetext={showResults ? t('quiz.resultsEyebrow') : t('quiz.progress', { n: q + 1, total: QUESTION_COUNT })}
              >
                {QUESTIONS.map((_, i) => (
                  <span
                    key={i}
                    data-state={showResults || i < q ? 'done' : i === q ? 'current' : 'todo'}
                  />
                ))}
              </div>
            </div>

            <div className="quiz-summary">
              <p className="quiz-tm">{t('quiz.yourAnswers')}</p>
              <ol>
                {QUESTIONS.map((question, i) => {
                  const summary = answerSummary(i);
                  const canEdit = summary !== '' && i !== q;
                  return (
                    <li key={i} data-current={i === q ? 'true' : 'false'}>
                      <span className="quiz-summary__num" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="quiz-summary__text">
                        <span className="quiz-summary__q">{t(question.short)}</span>
                        <span className="quiz-summary__a">{summary || t('quiz.notAnswered')}</span>
                      </span>
                      {canEdit && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm quiz-summary__edit"
                          onClick={() => goTo(i)}
                          aria-label={t('quiz.editLabel', { question: t(question.short) })}
                        >
                          {t('quiz.edit')}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>

          <div className="quiz-main">
            {showResults ? (
              <QuizResults recs={recs} answers={answers} headingRef={resultsRef} onRestart={restart} />
            ) : (
              <form
                key={q}
                className="quiz-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  onNext();
                }}
                noValidate
              >
                <fieldset className="quiz-fieldset" aria-describedby={error ? errorId : undefined}>
                  <legend className="quiz-legend">
                    <span className="quiz-tm quiz-legend__count">
                      {t('quiz.progress', { n: q + 1, total: QUESTION_COUNT })}
                    </span>
                    <h3 className="quiz-legend__title" ref={headingRef} tabIndex={-1}>
                      {t(QUESTIONS[q].title)}
                    </h3>
                    <span className="quiz-legend__hint">{t(QUESTIONS[q].hint)}</span>
                  </legend>

                  {q === 0 && (
                    <div className="quiz-options quiz-options--type">
                      {CUSTOMER_TYPES.map((id) => (
                        <Option
                          key={id}
                          id={id}
                          kind="radio"
                          name="quiz-type"
                          checked={type === id}
                          onChange={() => {
                            setError(false);
                            setAnswers((a) => setCustomerType(a, id));
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {q === 1 && type && (
                    <div className="quiz-options">
                      {ASSET_OPTIONS[type].map((id) => (
                        <Option
                          key={id}
                          id={id}
                          kind="checkbox"
                          name="quiz-assets"
                          checked={answers.assets.includes(id)}
                          onChange={() => {
                            setError(false);
                            setAnswers((a) => ({ ...a, assets: toggleItem<AssetId>(a.assets, id) }));
                          }}
                        />
                      ))}
                    </div>
                  )}
                  {q === 2 && type && (
                    <div className="quiz-options">
                      {CONCERN_OPTIONS[type].map((id) => (
                        <Option
                          key={id}
                          id={id}
                          kind="checkbox"
                          name="quiz-concerns"
                          checked={answers.concerns.includes(id)}
                          note={id === 'unsure' ? t('quiz.exclusiveNote') : undefined}
                          onChange={() => {
                            setError(false);
                            setAnswers((a) => ({ ...a, concerns: toggleConcern(a.concerns, id as ConcernId) }));
                          }}
                        />
                      ))}
                    </div>
                  )}
                </fieldset>

                <p id={errorId} className="quiz-error" role="alert">
                  {error ? (q === 0 ? t('quiz.errorPickOne') : t('quiz.errorPickAny')) : ''}
                </p>

                <div className="quiz-nav">
                  {q > 0 && (
                    <button type="button" className="btn btn--secondary" onClick={() => goTo(q - 1)}>
                      <ChevronLeft className="icon-flip" aria-hidden="true" />
                      {t('quiz.back')}
                    </button>
                  )}
                  <button type="submit" className="btn btn--primary quiz-nav__next">
                    {q === QUESTION_COUNT - 1 ? t('quiz.seeResults') : t('quiz.next')}
                    <ChevronRight className="icon-flip" aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

interface OptionProps {
  id: OptionId;
  kind: 'radio' | 'checkbox';
  name: string;
  checked: boolean;
  note?: string;
  onChange: () => void;
}

function Option({ id, kind, name, checked, note, onChange }: OptionProps) {
  const { t } = useI18n();
  const Icon = OPTION_ICON[id];
  return (
    <label className="quiz-opt" data-kind={kind}>
      <input type={kind} name={name} value={id} checked={checked} onChange={onChange} />
      <span className="quiz-opt__icon" aria-hidden="true">
        <Icon />
      </span>
      <span className="quiz-opt__text">
        <span className="quiz-opt__label">{t(optLabel(id))}</span>
        <span className="quiz-opt__desc">
          {t(optDesc(id))}
          {note && <span className="quiz-opt__note"> · {note}</span>}
        </span>
      </span>
      <span className="quiz-opt__check" aria-hidden="true">
        <Check />
      </span>
    </label>
  );
}
