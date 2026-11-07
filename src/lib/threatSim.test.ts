import { beforeEach, describe, expect, it } from 'vitest';
import {
  CATEGORY_WEIGHTS,
  PRESEED_COUNT,
  RATE_MAX,
  RATE_MIN,
  SIM_TICK_MS,
  VARIANTS_PER_CATEGORY,
  advanceSim,
  bucketize,
  burstFactor,
  categoryShares,
  createSim,
  eventId,
  mulberryStep,
  preseedSim,
  responseForEvent,
  resumeSim,
  serviceForEvent,
  totalRate,
} from './threatSim';
import { mulberry32 } from './random';
import { HOME_REGION, REGIONS } from './geo';
import { MAX_EVENTS, THREAT_CATEGORIES, useRadar, visibleEvents, type ThreatEvent } from '../state/radar';

const T0 = 1_780_000_000_000; // fixed epoch for reproducible tests
const MIN = 60_000;

function run(seed: number, ms: number) {
  return advanceSim(createSim(seed, T0), T0 + ms);
}

describe('threatSim — determinism', () => {
  it('produces the identical stream for the same seed', () => {
    const a = run(42, 2 * MIN).events;
    const b = run(42, 2 * MIN).events;
    expect(a.length).toBeGreaterThan(0);
    expect(b).toEqual(a);
  });

  it('produces a different stream for a different seed', () => {
    const a = run(42, MIN).events.map((e) => `${e.t}${e.category}`);
    const b = run(43, MIN).events.map((e) => `${e.t}${e.category}`);
    expect(b).not.toEqual(a);
  });

  it('does not depend on how advance() calls are chunked', () => {
    const whole = run(7, 30_000).events;
    let state = createSim(7, T0);
    const chunked: ThreatEvent[] = [];
    for (const step of [333, 1250, 70, 9001, 4321, 15025]) {
      const r = advanceSim(state, state.clock + step);
      state = r.state;
      chunked.push(...r.events);
    }
    const r = advanceSim(state, T0 + 30_000);
    chunked.push(...r.events);
    expect(chunked).toEqual(whole);
  });

  it('uses the same mulberry32 sequence as src/lib/random.ts, with explicit state', () => {
    const ref = mulberry32(99);
    let state = createSim(99, T0).rng;
    for (let i = 0; i < 25; i++) {
      const [value, next] = mulberryStep(state);
      expect(value).toBe(ref());
      state = next;
    }
  });

  it('a no-op advance leaves the state untouched', () => {
    const s = createSim(5, T0);
    const r = advanceSim(s, T0 + SIM_TICK_MS - 1);
    expect(r.events).toHaveLength(0);
    expect(r.state).toEqual(s);
  });
});

describe('threatSim — rates', () => {
  it('keeps the total rate within the documented band', () => {
    for (let t = 0; t < 7200; t += 0.37) {
      const r = totalRate(T0 / 1000 + t, 3);
      expect(r).toBeGreaterThanOrEqual(RATE_MIN);
      expect(r).toBeLessThanOrEqual(RATE_MAX);
    }
  });

  it('has bursts (multiplier above 1 somewhere, never below 1)', () => {
    let max = 0;
    for (let t = 0; t < 600; t += 0.25) {
      const f = burstFactor(T0 / 1000 + t, 11);
      expect(f).toBeGreaterThanOrEqual(1);
      max = Math.max(max, f);
    }
    expect(max).toBeGreaterThan(1.3);
  });

  it('category shares always sum to 1 and drift over time', () => {
    const a = categoryShares(T0 / 1000, 5);
    const b = categoryShares(T0 / 1000 + 20, 5);
    const sum = THREAT_CATEGORIES.reduce((s, c) => s + a[c], 0);
    expect(sum).toBeCloseTo(1, 10);
    expect(a.phishing).not.toBeCloseTo(b.phishing, 3);
  });

  it('generates a realistic average of ~0.6–2.5 events per second', () => {
    const minutes = 30;
    const { events } = run(2024, minutes * MIN);
    const perSecond = events.length / (minutes * 60);
    expect(perSecond).toBeGreaterThan(0.9);
    expect(perSecond).toBeLessThan(1.9);
  });

  it('is bursty: 10-second counts are over-dispersed compared with a plain Poisson process', () => {
    const { events } = run(77, 30 * MIN);
    const counts = new Array(180).fill(0);
    for (const e of events) counts[Math.floor((e.t - T0) / 10_000)] += 1;
    const mean = counts.reduce((s, c) => s + c, 0) / counts.length;
    const variance = counts.reduce((s, c) => s + (c - mean) ** 2, 0) / counts.length;
    expect(variance / mean).toBeGreaterThan(1.2);
  });
});

describe('threatSim — event content', () => {
  const { events } = run(9, 20 * MIN);

  it('matches the long-run category mix', () => {
    for (const c of THREAT_CATEGORIES) {
      const share = events.filter((e) => e.category === c).length / events.length;
      expect(Math.abs(share - CATEGORY_WEIGHTS[c])).toBeLessThan(0.06);
    }
  });

  it('uses valid regions, home target, severities, outcomes and variants', () => {
    const regionIds = new Set(REGIONS.map((r) => r.id));
    for (const e of events) {
      expect(regionIds.has(e.from)).toBe(true);
      expect(e.to).toBe(HOME_REGION.id);
      expect(['low', 'medium', 'high']).toContain(e.severity);
      expect(['blocked', 'flagged', 'observed']).toContain(e.outcome);
      expect(e.variant).toBeGreaterThanOrEqual(0);
      expect(e.variant).toBeLessThan(VARIANTS_PER_CATEGORY);
    }
    expect(new Set(events.map((e) => e.outcome)).size).toBe(3);
    expect(new Set(events.map((e) => e.severity)).size).toBe(3);
  });

  it('assigns unique, monotonic ids and keeps events in time order', () => {
    const ids = new Set(events.map((e) => e.id));
    expect(ids.size).toBe(events.length);
    for (let i = 1; i < events.length; i++) {
      expect(events[i].seq).toBe(events[i - 1].seq + 1);
      expect(events[i].t).toBeGreaterThanOrEqual(events[i - 1].t);
    }
    expect(events[0].id).toMatch(/^SG-[0-9A-F]{5,}$/);
    expect(eventId(255)).toBe('SG-000FF');
  });

  it('keeps every event inside the simulated window', () => {
    for (const e of events) {
      expect(e.t).toBeGreaterThanOrEqual(T0);
      expect(e.t).toBeLessThanOrEqual(T0 + 20 * MIN);
    }
  });
});

describe('threatSim — preseed and resume', () => {
  it('pre-seeds exactly PRESEED_COUNT recent events ending at now, with contiguous ids', () => {
    const now = T0 + 5 * MIN;
    const { state, events } = preseedSim(createSim(1, now, 10), now);
    expect(events).toHaveLength(PRESEED_COUNT);
    expect(events[0].seq).toBe(11);
    expect(events[events.length - 1].seq).toBe(10 + PRESEED_COUNT);
    expect(state.seq).toBe(10 + PRESEED_COUNT);
    for (const e of events) expect(e.t).toBeLessThanOrEqual(now);
    expect(state.clock).toBeLessThanOrEqual(now);
    expect(now - state.clock).toBeLessThan(SIM_TICK_MS);
  });

  it('never back-fills a paused gap', () => {
    let state = advanceSim(createSim(4, T0), T0 + 10_000).state;
    state = resumeSim(state, T0 + 70_000);
    const { events } = advanceSim(state, T0 + 75_000);
    for (const e of events) expect(e.t).toBeGreaterThanOrEqual(T0 + 70_000 - SIM_TICK_MS);
    expect((state.clock - T0) % SIM_TICK_MS).toBe(0);
  });
});

describe('threatSim — mappings and buckets', () => {
  it('maps categories to the related Shadow Gate service', () => {
    expect(serviceForEvent({ category: 'phishing', variant: 0 })).toBe('awareness');
    expect(serviceForEvent({ category: 'login', variant: 3 })).toBe('email-accounts');
    expect(serviceForEvent({ category: 'scanning', variant: 1 })).toBe('website-assessment');
    expect(serviceForEvent({ category: 'traffic', variant: 0 })).toBe('website-assessment');
    expect(serviceForEvent({ category: 'traffic', variant: 3 })).toBe('monthly-review');
    expect(responseForEvent({ category: 'traffic', variant: 2 })).toBe('traffic-review');
    expect(responseForEvent({ category: 'login', variant: 2 })).toBe('login');
  });

  it('buckets events per category and second', () => {
    const end = T0 + 60_000;
    const mk = (t: number, category: ThreatEvent['category']): ThreatEvent => ({
      id: String(t),
      seq: t,
      t,
      category,
      severity: 'low',
      from: 'eu-west',
      to: 'home',
      outcome: 'blocked',
      variant: 0,
    });
    const b = bucketize([mk(T0, 'phishing'), mk(T0 + 500, 'phishing'), mk(T0 + 59_999, 'traffic'), mk(T0 - 1, 'login'), mk(end, 'login')], end);
    expect(b.phishing[0]).toBe(2);
    expect(b.traffic[59]).toBe(1);
    expect(b.login.reduce((s, n) => s + n, 0)).toBe(0);
    expect(b.scanning).toHaveLength(60);
  });
});

describe('radar store integration', () => {
  beforeEach(() => {
    useRadar.setState({
      events: [],
      totals: { phishing: 0, login: 0, scanning: 0, traffic: 0 },
      selectedId: null,
      filters: { phishing: true, login: true, scanning: true, traffic: true },
      paused: false,
    });
  });

  it('caps the buffer at MAX_EVENTS (newest first) while totals keep counting', () => {
    const { events } = run(12, 8 * MIN);
    expect(events.length).toBeGreaterThan(MAX_EVENTS * 2);
    for (let i = 0; i < events.length; i += 37) useRadar.getState().pushEvents(events.slice(i, i + 37));
    const s = useRadar.getState();
    expect(s.events).toHaveLength(MAX_EVENTS);
    expect(s.events[0].id).toBe(events[events.length - 1].id);
    expect(s.events[0].t).toBeGreaterThanOrEqual(s.events[1].t);
    const total = THREAT_CATEGORIES.reduce((sum, c) => sum + s.totals[c], 0);
    expect(total).toBe(events.length);
  });

  it('clears a selection that falls out of the buffer or gets filtered out', () => {
    const { events } = run(13, 4 * MIN);
    useRadar.getState().pushEvents(events.slice(0, 10));
    const target = useRadar.getState().events[0];
    useRadar.getState().select(target.id);
    useRadar.getState().toggleFilter(target.category);
    expect(useRadar.getState().selectedId).toBeNull();
    expect(visibleEvents(useRadar.getState()).every((e) => e.category !== target.category)).toBe(true);
    useRadar.getState().setAllFilters(true);
    useRadar.getState().select(useRadar.getState().events[5].id);
    useRadar.getState().pushEvents(events.slice(10));
    expect(useRadar.getState().selectedId).toBeNull();
  });
});
