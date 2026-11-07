import { describe, expect, it } from 'vitest';
import { getService } from '../data/services';
import { LAST_STEP, SCENARIOS, SCENARIO_IDS, SIM_IDLE, simReducer, type SimState } from './scenarios';

const run = (autoplay = true) => simReducer(SIM_IDLE, { type: 'run', autoplay });

describe('simulation playback', () => {
  it('starts at step 0, playing (or paused without auto-advance)', () => {
    expect(run()).toEqual({ step: 0, status: 'playing' });
    expect(run(false)).toEqual({ step: 0, status: 'paused' });
  });

  it('auto-advances on tick and finishes on the last step', () => {
    let s: SimState = run();
    for (let i = 0; i < 10; i++) s = simReducer(s, { type: 'tick' });
    expect(s).toEqual({ step: LAST_STEP, status: 'done' });
  });

  it('ignores ticks while paused or idle', () => {
    const paused = simReducer(run(), { type: 'togglePlay' });
    expect(simReducer(paused, { type: 'tick' })).toBe(paused);
    expect(simReducer(SIM_IDLE, { type: 'tick' })).toBe(SIM_IDLE);
  });

  it('manual next/back pause playback and stay within bounds', () => {
    let s = simReducer(run(), { type: 'next' });
    expect(s).toEqual({ step: 1, status: 'paused' });
    s = simReducer(s, { type: 'back' });
    s = simReducer(s, { type: 'back' });
    expect(s).toEqual({ step: 0, status: 'paused' });
    s = simReducer(s, { type: 'goto', step: 99 });
    expect(s).toEqual({ step: LAST_STEP, status: 'done' });
    expect(simReducer(s, { type: 'next' })).toEqual({ step: LAST_STEP, status: 'done' });
  });

  it('play after finishing replays from the start', () => {
    const done: SimState = { step: LAST_STEP, status: 'done' };
    expect(simReducer(done, { type: 'togglePlay' })).toEqual({ step: 0, status: 'playing' });
    expect(simReducer(done, { type: 'reset' })).toEqual(SIM_IDLE);
  });
});

describe('scenario data', () => {
  it('links every scenario to real business services and four signals', () => {
    for (const id of SCENARIO_IDS) {
      const sc = SCENARIOS[id];
      expect(sc.signals).toHaveLength(4);
      for (const sid of sc.services) expect(getService(sid).audience).toBe('business');
    }
    expect(SCENARIOS.phishing.services).toEqual(['awareness', 'email-accounts']);
    expect(SCENARIOS.login.services).toEqual(['email-accounts']);
  });
});
