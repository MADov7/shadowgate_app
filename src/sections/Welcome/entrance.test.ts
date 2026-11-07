import { afterEach, describe, expect, it, vi } from 'vitest';
import { ENTRANCE_PLANS, cueHero, entranceKind, heroCued, onHeroCue, overlayAt, resetHeroCue } from './entrance';

describe('entranceKind', () => {
  it('uses the cinematic entrance only when the 3D scene is ready', () => {
    expect(entranceKind({ mode: 'cinematic', reducedMotion: false, sceneReady: true })).toBe('cinematic');
    expect(entranceKind({ mode: 'cinematic', reducedMotion: false, sceneReady: false })).toBe('static');
    expect(entranceKind({ mode: 'static', reducedMotion: false, sceneReady: false })).toBe('static');
  });
  it('reduced motion always wins', () => {
    expect(entranceKind({ mode: 'cinematic', reducedMotion: true, sceneReady: true })).toBe('reduced');
    expect(entranceKind({ mode: 'static', reducedMotion: true, sceneReady: false })).toBe('reduced');
  });
});

describe('ENTRANCE_PLANS', () => {
  it('never exceeds ~3 seconds and cues the hero before the end', () => {
    for (const plan of Object.values(ENTRANCE_PLANS)) {
      expect(plan.total).toBeLessThanOrEqual(3);
      expect(plan.heroCue).toBeLessThanOrEqual(plan.total);
      expect(plan.fadeStart).toBeLessThanOrEqual(plan.total);
    }
  });
});

describe('overlayAt', () => {
  it('starts fully scrimmed with no flash, ends clear', () => {
    expect(overlayAt(0)).toEqual({ scrim: 1, flash: 0, tags: 1 });
    const end = overlayAt(1);
    expect(end.scrim).toBeCloseTo(0, 5);
    expect(end.flash).toBeCloseTo(0, 5);
    expect(end.tags).toBe(0);
  });
  it('clears the gate-pinned HUD tags before the fly-through, while the scrim is still up', () => {
    const atFly = overlayAt(0.56);
    expect(atFly.tags).toBe(0);
    expect(atFly.scrim).toBeGreaterThan(0.5);
    expect(overlayAt(0.2).tags).toBe(1);
  });
  it('flashes while passing through the opening and is reversible (pure)', () => {
    expect(overlayAt(0.8).flash).toBeGreaterThan(0.9);
    expect(overlayAt(0.7)).toEqual(overlayAt(0.7));
    expect(overlayAt(-1)).toEqual(overlayAt(0));
    expect(overlayAt(2)).toEqual(overlayAt(1));
  });
});

describe('hero cue bus', () => {
  afterEach(() => resetHeroCue());

  it('notifies subscribers once', () => {
    const fn = vi.fn();
    const off = onHeroCue(fn);
    cueHero();
    cueHero();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(false);
    expect(heroCued()).toBe(true);
    off();
  });

  it('late subscribers receive the cue immediately (with the instant flag)', () => {
    cueHero(true);
    const fn = vi.fn();
    onHeroCue(fn);
    expect(fn).toHaveBeenCalledWith(true);
  });

  it('unsubscribed listeners are not called', () => {
    const fn = vi.fn();
    const off = onHeroCue(fn);
    off();
    cueHero();
    expect(fn).not.toHaveBeenCalled();
  });
});
