// Protection simulation — illustrative scenarios + a pure playback reducer.
// Scenarios are fictional and conceptual: they show how a layer is meant to help, not what a real attack or
// a real configuration would do. All copy lives in the 'simulation' i18n namespace.
import type { ServiceId } from '../data/types';

export const SCENARIO_IDS = ['phishing', 'login'] as const;
export type ScenarioId = (typeof SCENARIO_IDS)[number];

/** The four beats every scenario plays through. */
export const SIM_STEPS = ['event', 'signals', 'response', 'service'] as const;
export type SimStepKey = (typeof SIM_STEPS)[number];
export const SIM_STEP_COUNT = SIM_STEPS.length;
export const LAST_STEP = SIM_STEP_COUNT - 1;

/** Auto-advance interval per step (ms). Reduced motion → no auto-advance. */
export const STEP_MS = 1600;

export type SignalId = 'sender' | 'urgency' | 'link' | 'password' | 'device' | 'time' | 'location' | 'attempts';

export interface Scenario {
  id: ScenarioId;
  /** Category hue (matches the simulated-threat palette). */
  hue: 'phishing' | 'login';
  /** Warning signals highlighted on the artefact, in reading order. */
  signals: readonly SignalId[];
  /** Services that strengthen the layer in this scenario (first = primary). */
  services: readonly ServiceId[];
}

export const SCENARIOS: Record<ScenarioId, Scenario> = {
  phishing: {
    id: 'phishing',
    hue: 'phishing',
    signals: ['sender', 'urgency', 'password', 'link'],
    services: ['awareness', 'email-accounts'],
  },
  login: {
    id: 'login',
    hue: 'login',
    signals: ['device', 'time', 'location', 'attempts'],
    services: ['email-accounts'],
  },
};

// ---------- Playback ----------
export type SimStatus = 'idle' | 'playing' | 'paused' | 'done';

export interface SimState {
  status: SimStatus;
  /** -1 while idle, then 0..LAST_STEP. */
  step: number;
}

export type SimAction =
  | { type: 'run'; autoplay: boolean }
  | { type: 'tick' }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'goto'; step: number }
  | { type: 'togglePlay' }
  | { type: 'reset' };

export const SIM_IDLE: SimState = { status: 'idle', step: -1 };

const settle = (step: number): SimState => ({ step, status: step >= LAST_STEP ? 'done' : 'paused' });

export function simReducer(state: SimState, action: SimAction): SimState {
  switch (action.type) {
    case 'run':
      return { step: 0, status: action.autoplay ? 'playing' : 'paused' };
    case 'tick':
      // Only the auto-advance timer ticks; it stops on the last step.
      if (state.status !== 'playing') return state;
      return state.step + 1 >= LAST_STEP
        ? { step: LAST_STEP, status: 'done' }
        : { step: state.step + 1, status: 'playing' };
    case 'next':
      // Stepping manually pauses the auto-advance so the visitor stays in control.
      if (state.status === 'idle') return settle(0);
      return settle(Math.min(LAST_STEP, state.step + 1));
    case 'back':
      if (state.status === 'idle') return state;
      return settle(Math.max(0, state.step - 1));
    case 'goto':
      return settle(Math.max(0, Math.min(LAST_STEP, action.step)));
    case 'togglePlay':
      if (state.status === 'playing') return { ...state, status: 'paused' };
      if (state.status === 'paused') return { ...state, status: 'playing' };
      // Idle or finished → play from the start.
      return { step: 0, status: 'playing' };
    case 'reset':
      return SIM_IDLE;
    default:
      return state;
  }
}
