// Interaction G — Protection Simulation. Two clearly labelled, fictional scenarios played as a step timeline
// (event → warning signals → conceptual response → associated service) with a with/without-the-layer toggle.
import { useEffect, useReducer, useRef, useState, type CSSProperties } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Info,
  LogIn,
  MailWarning,
  Pause,
  Play,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  TriangleAlert,
  type LucideIcon,
} from 'lucide-react';
import { useI18n, type TKey } from '../../i18n';
import {
  LAST_STEP,
  SCENARIOS,
  SCENARIO_IDS,
  SIM_IDLE,
  SIM_STEPS,
  SIM_STEP_COUNT,
  STEP_MS,
  simReducer,
  type ScenarioId,
  type SimStepKey,
} from '../../lib/scenarios';
import { useExperience } from '../../state/experience';
import { ServiceLink } from '../Layers/ServiceLink';
import { EmailArtefact, LoginArtefact, type MarkState } from './Artefacts';
import './Simulation.css';

const SCENARIO_ICON: Record<ScenarioId, LucideIcon> = { phishing: MailWarning, login: LogIn };
const pad = (n: number) => String(n).padStart(2, '0');

type Translate = (key: TKey, vars?: Record<string, string | number>) => string;

/** Title + body for a step of a scenario (signals/response depend on the with/without toggle). */
function stepCopy(t: Translate, sc: ScenarioId, step: SimStepKey, withLayer: boolean) {
  const mode = withLayer ? 'with' : 'without';
  switch (step) {
    case 'event':
      return { title: t(`simulation.${sc}_event_title`), body: t(`simulation.${sc}_event_body`) };
    case 'signals':
      return { title: t(`simulation.${sc}_signals_title_${mode}`), body: t(`simulation.${sc}_signals_body_${mode}`) };
    case 'response':
      return { title: t(`simulation.${sc}_response_title_${mode}`), body: t(`simulation.${sc}_response_body_${mode}`) };
    default:
      return { title: t(`simulation.${sc}_service_title`), body: t(`simulation.${sc}_service_body`) };
  }
}

export function Simulation() {
  const { t } = useI18n();
  const reduced = useExperience((s) => s.reducedMotion);
  const [scenarioId, setScenarioId] = useState<ScenarioId>('phishing');
  const [withLayer, setWithLayer] = useState(true);
  const [modeTouched, setModeTouched] = useState(false);
  const [state, dispatch] = useReducer(simReducer, SIM_IDLE);
  const [runId, setRunId] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const remaining = useRef(STEP_MS);

  const scenario = SCENARIOS[scenarioId];
  const ScenarioIcon = SCENARIO_ICON[scenarioId];
  const { status, step } = state;
  const idle = status === 'idle';
  const playing = status === 'playing';

  // Auto-advance (~1.6 s per step). The remaining time survives pause/resume so the CSS bar stays in sync.
  useEffect(() => {
    remaining.current = STEP_MS;
  }, [step, scenarioId, runId]);
  useEffect(() => {
    if (status !== 'playing') return;
    const started = performance.now();
    const id = window.setTimeout(() => dispatch({ type: 'tick' }), remaining.current);
    return () => {
      window.clearTimeout(id);
      remaining.current = Math.max(0, remaining.current - (performance.now() - started));
    };
  }, [status, step, runId]);

  // Reduced motion → never auto-advance.
  useEffect(() => {
    if (reduced && status === 'playing') dispatch({ type: 'togglePlay' });
  }, [reduced, status]);

  // Pause when the section scrolls out of view so nobody misses a step.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || status !== 'playing') return;
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) dispatch({ type: 'togglePlay' });
    });
    io.observe(el);
    return () => io.disconnect();
  }, [status]);

  const chooseScenario = (id: ScenarioId) => {
    setScenarioId(id);
    dispatch({ type: 'reset' });
  };
  const chooseMode = (next: boolean) => {
    setWithLayer(next);
    setModeTouched(true);
  };
  const run = () => {
    setRunId((n) => n + 1);
    dispatch({ type: 'run', autoplay: !reduced });
  };

  const marks: MarkState = step >= 1 ? (withLayer ? 'on' : 'missed') : 'off';
  const outcome = step >= 2 ? (withLayer ? 'defended' : 'threat') : 'none';
  const outcomeText = t(`simulation.${scenarioId}_outcome_${withLayer ? 'with' : 'without'}`);
  const artefactProps = { marks, outcome, outcomeText } as const;

  const statusText = idle
    ? t('simulation.statusIdle')
    : playing
      ? t('simulation.statusPlaying')
      : status === 'done'
        ? t('simulation.statusDone')
        : t('simulation.statusPaused');

  const current = step >= 0 ? stepCopy(t, scenarioId, SIM_STEPS[step], withLayer) : null;
  // Step changes are announced; while idle, the with/without toggle announces the outcome being compared.
  const announcement = current
    ? t('simulation.announce', { n: step + 1, total: SIM_STEP_COUNT, title: current.title, body: current.body })
    : modeTouched
      ? t('simulation.announceMode', { mode: withLayer ? t('simulation.withLayer') : t('simulation.withoutLayer') })
      : '';

  return (
    <section
      id="simulation"
      ref={sectionRef}
      className="section sim"
      aria-labelledby="simulation-title"
      data-hue={scenario.hue}
    >
      <div className="container">
        <header className="section-head sim-head">
          <div className="sim-head__row">
            <p className="eyebrow">{t('simulation.eyebrow')}</p>
            <span className="badge badge--demo">{t('simulation.badge')}</span>
          </div>
          <h2 id="simulation-title" className="h2">
            {t('simulation.title')}
          </h2>
          <p className="lead">{t('simulation.lead')}</p>
        </header>

        <div className="sim-shell panel">
          {/* Scenario picker: native radios styled as cards */}
          <fieldset className="sim-pick">
            <legend className="sim-label">{t('simulation.pickLabel')}</legend>
            <div className="sim-pick__grid">
              {SCENARIO_IDS.map((id) => {
                const Icon = SCENARIO_ICON[id];
                return (
                  <label key={id} className="sim-choice" data-hue={SCENARIOS[id].hue}>
                    <input
                      type="radio"
                      name="sim-scenario"
                      value={id}
                      checked={scenarioId === id}
                      onChange={() => chooseScenario(id)}
                    />
                    <span className="sim-choice__icon" aria-hidden="true">
                      <Icon />
                    </span>
                    <span className="sim-choice__text">
                      <span className="sim-choice__name">{t(`simulation.${id}Name`)}</span>
                      <span className="sim-choice__desc">{t(`simulation.${id}Desc`)}</span>
                    </span>
                    <span className="sim-choice__check" aria-hidden="true">
                      <Check />
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <div className="sim-grid">
            {/* Visual: fictional artefact with coach marks + the scenario path */}
            <div className="sim-visual">
              {scenarioId === 'phishing' ? <EmailArtefact {...artefactProps} /> : <LoginArtefact {...artefactProps} />}
              <ScenarioPath step={step} withLayer={withLayer} outcomeText={outcomeText} />
              <p className="sim-fiction">{t('simulation.fictionalNote')}</p>
            </div>

            {/* Flow: compare toggle, stepper, step detail, controls */}
            <div className="sim-flow">
              <div className="sim-flow__head">
                <h3 className="sim-flow__title">{t(`simulation.${scenarioId}Name`)}</h3>
                <span className="sim-status" data-status={status}>
                  <span className="sim-status__dot" aria-hidden="true" />
                  <span className="sim-tm">
                    {idle ? statusText : `${t('simulation.stepCounter', { n: pad(step + 1), total: pad(SIM_STEP_COUNT) })} · ${statusText}`}
                  </span>
                </span>
              </div>

              <div className="sim-compare" role="group" aria-label={t('simulation.compareLabel')}>
                <span className="sim-label" aria-hidden="true">
                  {t('simulation.compareLabel')}
                </span>
                <div className="segmented sim-seg">
                  <button
                    type="button"
                    data-tone="threat"
                    aria-pressed={!withLayer}
                    onClick={() => chooseMode(false)}
                  >
                    <ShieldOff aria-hidden="true" />
                    {t('simulation.withoutLayer')}
                  </button>
                  <button type="button" aria-pressed={withLayer} onClick={() => chooseMode(true)}>
                    <ShieldCheck aria-hidden="true" />
                    {t('simulation.withLayer')}
                  </button>
                </div>
              </div>

              <ol className="sim-steps" aria-label={t('simulation.timelineLabel')}>
                {SIM_STEPS.map((key, i) => {
                  const st = idle ? 'upcoming' : i < step ? 'done' : i === step ? 'current' : 'upcoming';
                  const tone =
                    key === 'response' && !withLayer ? 'threat' : key === 'signals' && !withLayer ? 'missed' : 'ok';
                  const copy = stepCopy(t, scenarioId, key, withLayer);
                  return (
                    <li key={key} className="sim-step" data-state={st} data-tone={tone}>
                      <button
                        type="button"
                        className="sim-step__btn"
                        aria-current={st === 'current' ? 'step' : undefined}
                        onClick={() => dispatch({ type: 'goto', step: i })}
                      >
                        <span className="sim-step__marker" aria-hidden="true">
                          {st === 'done' ? <Check /> : pad(i + 1)}
                        </span>
                        <span className="sim-step__text">
                          <span className="sim-step__kicker">{t(`simulation.step_${key}`)}</span>
                          <span className="sim-step__title">{copy.title}</span>
                        </span>
                      </button>
                      {st === 'current' && (playing || status === 'paused') && !reduced && (
                        // Same key while pausing/resuming, so the CSS fill keeps its progress.
                        <span
                          key={`${runId}-${scenarioId}-${step}`}
                          className="sim-step__bar"
                          data-paused={playing ? 'false' : 'true'}
                          aria-hidden="true"
                          style={{ '--sim-dur': `${STEP_MS}ms` } as CSSProperties}
                        />
                      )}
                    </li>
                  );
                })}
              </ol>

              <div className="sim-detail">
                <div className="sim-pane sim-pane--idle" data-active={idle ? 'true' : 'false'} aria-hidden={!idle} inert={!idle}>
                  <span className="sim-idle__ring" aria-hidden="true">
                    <ScenarioIcon />
                  </span>
                  <p className="sim-idle__hint">{reduced ? t('simulation.manualHint') : t('simulation.idleHint')}</p>
                  <p className="sim-tm sim-idle__meta" aria-hidden="true">
                    {t(reduced ? 'simulation.idleMetaManual' : 'simulation.idleMeta', { n: SIM_STEP_COUNT })}
                  </p>
                </div>
                {SIM_STEPS.map((key, i) => {
                  const copy = stepCopy(t, scenarioId, key, withLayer);
                  const active = !idle && i === step;
                  return (
                    <div
                      key={key}
                      className="sim-pane"
                      data-active={active ? 'true' : 'false'}
                      data-key={key}
                      data-tone={key === 'response' ? (withLayer ? 'defended' : 'threat') : undefined}
                      aria-hidden={!active}
                      inert={!active}
                    >
                      <p className="sim-pane__kicker">
                        {key === 'response' &&
                          (withLayer ? <ShieldCheck aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />)}
                        {copy.title}
                      </p>
                      <p className="sim-pane__body">{copy.body}</p>
                      {key === 'signals' && (
                        <ol className="sim-signals" data-mode={withLayer ? 'on' : 'missed'}>
                          {scenario.signals.map((sig, n) => (
                            <li key={sig}>
                              <span className="sim-signals__n" aria-hidden="true">
                                {n + 1}
                              </span>
                              <span>
                                <strong>{t(`simulation.sig_${sig}`)}</strong>
                                {withLayer ? (
                                  <span className="sim-signals__detail"> — {t(`simulation.sig_${sig}_detail`)}</span>
                                ) : (
                                  <span className="sim-signals__missed"> — {t('simulation.signalsMissed')}</span>
                                )}
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                      {key === 'service' && (
                        <div className="sim-services">
                          <span className="sim-label">{t('simulation.layersInvolved')}</span>
                          {scenario.services.map((sid) => (
                            <ServiceLink key={sid} id={sid} compact />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="sim-controls" role="group" aria-label={t('simulation.controlsLabel')}>
                <button type="button" className="btn btn--primary" onClick={run}>
                  {idle ? <Play aria-hidden="true" /> : <RotateCcw aria-hidden="true" />}
                  {idle ? t('simulation.run') : t('simulation.replay')}
                </button>
                {!reduced && !idle && (
                  <button type="button" className="btn btn--secondary" onClick={() => dispatch({ type: 'togglePlay' })}>
                    {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
                    {playing ? t('simulation.pause') : t('simulation.play')}
                  </button>
                )}
                <span className="sim-controls__nav">
                  <button
                    type="button"
                    className="btn btn--secondary btn--icon"
                    aria-disabled={idle || step <= 0}
                    onClick={() => !(idle || step <= 0) && dispatch({ type: 'back' })}
                    aria-label={t('simulation.back')}
                    title={t('simulation.back')}
                  >
                    <ChevronLeft className="icon-flip" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary btn--icon"
                    aria-disabled={step >= LAST_STEP}
                    onClick={() => step < LAST_STEP && dispatch({ type: 'next' })}
                    aria-label={t('simulation.next')}
                    title={t('simulation.next')}
                  >
                    <ChevronRight className="icon-flip" aria-hidden="true" />
                  </button>
                </span>
              </div>
            </div>
          </div>

          <p className="sim-disclaimer">
            <Info aria-hidden="true" />
            {t('simulation.disclaimer')}
          </p>
        </div>

        <p className="sr-only" aria-live="polite">
          {announcement}
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------- Scenario path (event → signals → layer → outcome)

function ScenarioPath({ step, withLayer, outcomeText }: { step: number; withLayer: boolean; outcomeText: string }) {
  const { t } = useI18n();
  const nodes: Array<{ key: TKey; reached: boolean }> = [
    { key: 'simulation.path_event', reached: step >= 0 },
    { key: 'simulation.path_signals', reached: step >= 1 },
    { key: 'simulation.path_layer', reached: step >= 2 },
    { key: 'simulation.path_outcome', reached: step >= 2 },
  ];
  const tone = withLayer ? 'defended' : 'threat';
  return (
    <div className="sim-path" data-tone={tone} aria-label={t('simulation.pathLabel')} role="group">
      <ol className="sim-path__track">
        {nodes.map((n, i) => (
          <li
            key={n.key}
            className="sim-path__node"
            data-reached={n.reached ? 'true' : 'false'}
            data-layer={i === 2 ? (withLayer ? 'up' : 'down') : undefined}
          >
            <span className="sim-path__dot" aria-hidden="true">
              {i === 2 ? withLayer ? <ShieldCheck /> : <ShieldOff /> : null}
            </span>
            <span className="sim-path__label">{t(n.key)}</span>
          </li>
        ))}
      </ol>
      <p className="sim-path__outcome" data-show={step >= 2 ? 'true' : 'false'}>
        {withLayer ? <ShieldCheck aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
        <span>
          <span className="sim-path__outcome-k">{t('simulation.outcomeLabel')}:</span> {step >= 2 ? outcomeText : '—'}
        </span>
      </p>
    </div>
  );
}
