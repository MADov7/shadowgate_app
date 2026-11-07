// SIMULATED threat-radar event generator. EVERYTHING here is locally generated demo data —
// it is NOT real threat intelligence, nothing is fetched and nothing scans the visitor.
//
// Model: a seeded (mulberry32) Cox process. The total arrival rate drifts slowly (two sines) and is modulated by
// occasional short bursts, clamped to RATE_MIN..RATE_MAX events/s. Each category gets a slowly drifting share of
// that rate; arrivals are sampled per fixed 100 ms tick (Poisson), so the stream is identical however the
// caller chunks its advance() calls. Pure functions below; the React runner hook is at the end of the file.
import { useEffect, useState, type RefObject } from 'react';
import type { BusinessServiceId } from '../data/types';
import { HOME_REGION, REGIONS } from './geo';
import { mulberry32 } from './random';
import {
  THREAT_CATEGORIES,
  useRadar,
  type Outcome,
  type Severity,
  type ThreatCategory,
  type ThreatEvent,
} from '../state/radar';

/** Fixed sampling tick. Event times fall inside their tick. */
export const SIM_TICK_MS = 100;
export const RATE_MIN = 0.6;
export const RATE_MAX = 2.5;
/** Number of description variants per category (radar i18n keys desc<Category>0..3). */
export const VARIANTS_PER_CATEGORY = 4;
/** Events pre-generated on first activation so the feed is never empty. */
export const PRESEED_COUNT = 30;

/** Long-run category mix (before the slow drift). */
export const CATEGORY_WEIGHTS: Record<ThreatCategory, number> = {
  scanning: 0.34,
  phishing: 0.27,
  login: 0.23,
  traffic: 0.16,
};

const SEVERITY_WEIGHTS: Record<ThreatCategory, Record<Severity, number>> = {
  phishing: { low: 0.35, medium: 0.45, high: 0.2 },
  login: { low: 0.3, medium: 0.45, high: 0.25 },
  scanning: { low: 0.6, medium: 0.3, high: 0.1 },
  traffic: { low: 0.3, medium: 0.4, high: 0.3 },
};

const OUTCOME_WEIGHTS: Record<Severity, Record<Outcome, number>> = {
  low: { blocked: 0.5, flagged: 0.15, observed: 0.35 },
  medium: { blocked: 0.6, flagged: 0.3, observed: 0.1 },
  high: { blocked: 0.7, flagged: 0.28, observed: 0.02 },
};

/** Illustrative origin weights. The Gulf region sits next to the demo network, so it is rarer (short arcs). */
const REGION_WEIGHTS: ReadonlyArray<{ id: string; weight: number }> = REGIONS.map((r) => ({
  id: r.id,
  weight: r.id === 'gulf' ? 0.35 : r.id === 'oceania' || r.id === 's-africa' ? 0.7 : 1,
}));

export interface SimState {
  seed: number;
  /** mulberry32 internal state (kept explicit so every function stays pure). */
  rng: number;
  /** Last assigned sequence number. */
  seq: number;
  /** Events have been generated up to this time (ms since epoch, tick aligned to the start). */
  clock: number;
}

export function createSim(seed: number, now: number, startSeq = 0): SimState {
  return { seed: seed >>> 0, rng: seed >>> 0, seq: startSeq, clock: now };
}

// ---------- Rates (pure functions of time + seed) ----------
interface Phases {
  base: [number, number];
  share: Record<ThreatCategory, number>;
}
const phaseCache = new Map<number, Phases>();
function phases(seed: number): Phases {
  let p = phaseCache.get(seed);
  if (!p) {
    const r = mulberry32(seed ^ 0x51a7e5);
    const tau = Math.PI * 2;
    p = {
      base: [r() * tau, r() * tau],
      share: { phishing: r() * tau, login: r() * tau, scanning: r() * tau, traffic: r() * tau },
    };
    if (phaseCache.size > 32) phaseCache.clear();
    phaseCache.set(seed, p);
  }
  return p;
}

const BURST_WINDOW_S = 11;
/** Multiplier ≥ 1: short, seeded bumps (≈ 30% of 11-second windows contain one). */
export function burstFactor(tSec: number, seed: number): number {
  const k = Math.floor(tSec / BURST_WINDOW_S);
  let f = 1;
  for (let w = k - 1; w <= k + 1; w++) {
    const r = mulberry32((seed ^ Math.imul(w, 0x9e3779b1)) >>> 0);
    if (r() >= 0.3) continue;
    const centre = (w + r()) * BURST_WINDOW_S;
    const width = 1.5 + r() * 2;
    const amp = 0.5 + r() * 0.7;
    const x = (tSec - centre) / width;
    f += amp * Math.exp(-x * x);
  }
  return f;
}

/** Total simulated arrival rate (events / s) at time tSec (seconds since epoch). Always within RATE_MIN..RATE_MAX. */
export function totalRate(tSec: number, seed: number): number {
  const p = phases(seed);
  const tau = Math.PI * 2;
  const base = 1.22 + 0.3 * Math.sin((tau * tSec) / 53 + p.base[0]) + 0.18 * Math.sin((tau * tSec) / 17 + p.base[1]);
  const r = base * burstFactor(tSec, seed);
  return r < RATE_MIN ? RATE_MIN : r > RATE_MAX ? RATE_MAX : r;
}

const SHARE_PERIOD_S: Record<ThreatCategory, number> = { phishing: 71, login: 59, scanning: 83, traffic: 47 };

/** Slowly drifting category shares (sum to 1). */
export function categoryShares(tSec: number, seed: number): Record<ThreatCategory, number> {
  const p = phases(seed);
  const tau = Math.PI * 2;
  const raw = { phishing: 0, login: 0, scanning: 0, traffic: 0 } as Record<ThreatCategory, number>;
  let sum = 0;
  for (const c of THREAT_CATEGORIES) {
    raw[c] = CATEGORY_WEIGHTS[c] * (1 + 0.4 * Math.sin((tau * tSec) / SHARE_PERIOD_S[c] + p.share[c]));
    sum += raw[c];
  }
  for (const c of THREAT_CATEGORIES) raw[c] /= sum;
  return raw;
}

export function categoryRate(category: ThreatCategory, tSec: number, seed: number): number {
  return totalRate(tSec, seed) * categoryShares(tSec, seed)[category];
}

// ---------- Event generation ----------
export function eventId(seq: number): string {
  return `SG-${seq.toString(16).toUpperCase().padStart(5, '0')}`;
}

function pickWeighted<T extends string>(rand: () => number, weights: Record<T, number>): T {
  const keys = Object.keys(weights) as T[];
  let total = 0;
  for (const k of keys) total += weights[k];
  let roll = rand() * total;
  for (const k of keys) {
    roll -= weights[k];
    if (roll <= 0) return k;
  }
  return keys[keys.length - 1];
}

function pickRegion(rand: () => number): string {
  let total = 0;
  for (const r of REGION_WEIGHTS) total += r.weight;
  let roll = rand() * total;
  for (const r of REGION_WEIGHTS) {
    roll -= r.weight;
    if (roll <= 0) return r.id;
  }
  return REGION_WEIGHTS[REGION_WEIGHTS.length - 1].id;
}

/** Knuth's Poisson sampler — fine for the small λ of a 100 ms tick. */
function poisson(rand: () => number, lambda: number): number {
  const limit = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= rand();
  } while (p > limit && k < 50);
  return k - 1;
}

/**
 * One mulberry32 step with explicit state (same sequence as src/lib/random.ts mulberry32), so advanceSim() can
 * return the new generator state instead of hiding it in a closure. Returns [value in 0..1, next state].
 */
export function mulberryStep(state: number): [number, number] {
  const a = (state + 0x6d2b79f5) >>> 0;
  let t = a;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, a];
}

function stepper(initial: number) {
  const box = { a: initial >>> 0 };
  const rand = () => {
    const [value, next] = mulberryStep(box.a);
    box.a = next;
    return value;
  };
  return { rand, box };
}

/** Generates every event in whole ticks up to `to` (ms). Returned events are oldest → newest. */
export function advanceSim(state: SimState, to: number): { state: SimState; events: ThreatEvent[] } {
  const { rand, box } = stepper(state.rng);
  let clock = state.clock;
  let seq = state.seq;
  const events: ThreatEvent[] = [];
  const dt = SIM_TICK_MS / 1000;
  while (clock + SIM_TICK_MS <= to) {
    const tSec = (clock + SIM_TICK_MS / 2) / 1000;
    const total = totalRate(tSec, state.seed);
    const shares = categoryShares(tSec, state.seed);
    const tick: ThreatEvent[] = [];
    for (const category of THREAT_CATEGORIES) {
      const n = poisson(rand, total * shares[category] * dt);
      for (let i = 0; i < n; i++) {
        const t = Math.round(clock + rand() * SIM_TICK_MS);
        const severity = pickWeighted(rand, SEVERITY_WEIGHTS[category]);
        const outcome = pickWeighted(rand, OUTCOME_WEIGHTS[severity]);
        const from = pickRegion(rand);
        const variant = Math.floor(rand() * VARIANTS_PER_CATEGORY) % VARIANTS_PER_CATEGORY;
        tick.push({ id: '', seq: 0, t, category, severity, from, to: HOME_REGION.id, outcome, variant });
      }
    }
    tick.sort((a, b) => a.t - b.t);
    for (const e of tick) {
      seq += 1;
      e.seq = seq;
      e.id = eventId(seq);
      events.push(e);
    }
    clock += SIM_TICK_MS;
  }
  return { state: { seed: state.seed, rng: box.a, seq, clock }, events };
}

/** Moves the clock to `now` (tick aligned) WITHOUT generating — used after a pause so we never back-fill. */
export function resumeSim(state: SimState, now: number): SimState {
  if (now <= state.clock) return state;
  const ticks = Math.floor((now - state.clock) / SIM_TICK_MS);
  return { ...state, clock: state.clock + ticks * SIM_TICK_MS };
}

/**
 * Pre-generates the most recent `count` events ending at `now`, so the feed starts populated.
 * Sequence numbers continue from state.seq without gaps.
 */
export function preseedSim(
  state: SimState,
  now: number,
  count = PRESEED_COUNT,
): { state: SimState; events: ThreatEvent[] } {
  let windowMs = 50_000;
  let result = advanceSim({ ...state, clock: now - windowMs }, now);
  for (let tries = 0; result.events.length < count && tries < 3; tries++) {
    windowMs *= 1.6;
    result = advanceSim({ ...state, clock: now - windowMs }, now);
  }
  const kept = result.events.slice(-count).map((e, i) => {
    const seq = state.seq + i + 1;
    return { ...e, seq, id: eventId(seq) };
  });
  return { state: { ...result.state, seq: state.seq + kept.length }, events: kept };
}

// ---------- Mappings used by the UI ----------
/** Related Shadow Gate service for an event (malicious traffic splits by scenario variant). */
export function serviceForEvent(e: Pick<ThreatEvent, 'category' | 'variant'>): BusinessServiceId {
  switch (e.category) {
    case 'phishing':
      return 'awareness';
    case 'login':
      return 'email-accounts';
    case 'scanning':
      return 'website-assessment';
    case 'traffic':
      return e.variant < 2 ? 'website-assessment' : 'monthly-review';
  }
}

export type ResponseKind = 'phishing' | 'login' | 'scanning' | 'traffic-site' | 'traffic-review';
export function responseForEvent(e: Pick<ThreatEvent, 'category' | 'variant'>): ResponseKind {
  if (e.category === 'traffic') return e.variant < 2 ? 'traffic-site' : 'traffic-review';
  return e.category;
}

export type Buckets = Record<ThreatCategory, number[]>;

/** Counts events per category into `count` buckets of `bucketMs` that end at `end` (exclusive). */
export function bucketize(events: readonly ThreatEvent[], end: number, count = 60, bucketMs = 1000): Buckets {
  const out = {
    phishing: new Array<number>(count).fill(0),
    login: new Array<number>(count).fill(0),
    scanning: new Array<number>(count).fill(0),
    traffic: new Array<number>(count).fill(0),
  } as Buckets;
  const start = end - count * bucketMs;
  for (const e of events) {
    if (e.t < start || e.t >= end) continue;
    out[e.category][Math.floor((e.t - start) / bucketMs)] += 1;
  }
  return out;
}

// ---------- Runner (React) ----------
/** Max gap we simulate in one go (timers can be throttled); anything longer is skipped, not back-filled. */
const MAX_CATCHUP_MS = 2000;
const RUN_INTERVAL_MS = 250;

let runtime: { sim: SimState; seeded: boolean } | null = null;

/** For tests: forget the page-level simulation. */
export function resetThreatRuntime(): void {
  runtime = null;
}

function pageSeed(): number {
  return (Date.now() ^ 0x5eed_c0de) >>> 0;
}

/**
 * Runs the simulation ONLY while the radar section is near the viewport, the document is visible and the
 * visitor has not paused it. Pre-seeds recent events on first activation. Returns whether it is running.
 */
export function useThreatSimulation(ref: RefObject<HTMLElement | null>): { active: boolean } {
  const paused = useRadar((s) => s.paused);
  const [near, setNear] = useState(false);
  const [docVisible, setDocVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState !== 'hidden',
  );

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), {
      rootMargin: '40% 0px 40% 0px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);

  useEffect(() => {
    const onVisibility = () => setDocVisible(document.visibilityState !== 'hidden');
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const active = near && docVisible && !paused;

  useEffect(() => {
    if (!active) return;
    const store = useRadar.getState();
    const now = Date.now();
    if (!runtime) runtime = { sim: createSim(pageSeed(), now, store.events[0]?.seq ?? 0), seeded: false };
    const rt = runtime;
    if (!rt.seeded) {
      const seeded = preseedSim(rt.sim, now);
      rt.sim = seeded.state;
      rt.seeded = true;
      store.pushEvents(seeded.events);
    } else {
      rt.sim = resumeSim(rt.sim, now);
    }
    const id = window.setInterval(() => {
      const t = Date.now();
      if (t - rt.sim.clock > MAX_CATCHUP_MS) rt.sim = resumeSim(rt.sim, t - MAX_CATCHUP_MS);
      const next = advanceSim(rt.sim, t);
      rt.sim = next.state;
      useRadar.getState().pushEvents(next.events);
    }, RUN_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [active]);

  return { active };
}
