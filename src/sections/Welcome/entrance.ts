// Entrance orchestration — pure timing plan + a tiny cue bus that lets the hero start revealing its copy
// while the camera is still arriving (so the welcome → hero hand-off has no hard cut).
import { ENTRY_PHASES } from '../../three/worldLayout';
import { clamp01, range, smoothstep } from '../../lib/choreo';

/**
 * cinematic: the 3D world is ready → animate scrollState.entry (light trace → doors → fly-through).
 * static:    no 3D yet / no WebGL → the SVG StaticGate opens with CSS, then crossfades into the site.
 * reduced:   reduced motion → no movement, one short crossfade.
 */
export type EntranceKind = 'cinematic' | 'static' | 'reduced';

export function entranceKind(opts: { mode: 'cinematic' | 'static'; reducedMotion: boolean; sceneReady: boolean }): EntranceKind {
  if (opts.reducedMotion) return 'reduced';
  return opts.mode === 'cinematic' && opts.sceneReady ? 'cinematic' : 'static';
}

export interface EntrancePlan {
  /** Total duration in seconds (≤ ~3 s for every kind). */
  total: number;
  /** When (s) the hero copy starts revealing. */
  heroCue: number;
  /** When (s) the overlay itself starts fading out. */
  fadeStart: number;
}

export const ENTRANCE_PLANS: Record<EntranceKind, EntrancePlan> = {
  // entry 0→1 over 2.8 s; the hero cue lands as the camera clears the gate plane (fly phase ~55%).
  cinematic: { total: 2.8, heroCue: 2.8 * 0.74, fadeStart: 2.8 * ENTRY_PHASES.fly[0] },
  // leaves slide (0.3–1.1 s), push through the opening (0.8–1.6 s), crossfade (1.35–1.9 s).
  static: { total: 1.9, heroCue: 1.3, fadeStart: 1.35 },
  reduced: { total: 0.3, heroCue: 0, fadeStart: 0 },
};

/**
 * Overlay visuals as a pure function of entry progress (cinematic kind):
 *  - scrim: welcome vignette/scrims fade as the camera flies (1 → 0)
 *  - flash: a soft teal bloom peaking as the camera passes through the opening
 */
export function overlayAt(entry: number): { scrim: number; flash: number; tags: number } {
  const e = clamp01(entry);
  const scrim = 1 - smoothstep(ENTRY_PHASES.fly[0], 0.96, e);
  const rise = smoothstep(0.58, 0.8, e);
  const fall = 1 - smoothstep(0.8, 1, e);
  // HUD tags are pinned to the closed gate's screen position — clear them before the camera starts to move.
  const tags = 1 - smoothstep(0.3, ENTRY_PHASES.fly[0] + 0.08, e);
  return { scrim, flash: rise * fall, tags };
}

/** Edge-light trace progress (0..1) for HUD details that echo the 3D trace phase. */
export function traceAt(entry: number): number {
  return range(ENTRY_PHASES.trace[0], ENTRY_PHASES.trace[1], entry);
}

// ---------- Hero cue bus ----------
type CueListener = (instant: boolean) => void;
const listeners = new Set<CueListener>();
let cued = false;
let cuedInstant = false;

/** Tells the hero to reveal its copy. `instant` = jump to the end state (e.g. "Go directly to services"). */
export function cueHero(instant = false): void {
  if (cued) return;
  cued = true;
  cuedInstant = instant;
  listeners.forEach((fn) => fn(instant));
}

/** Subscribe to the cue; fires immediately if it already happened. Returns an unsubscribe function. */
export function onHeroCue(fn: CueListener): () => void {
  if (cued) fn(cuedInstant);
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function heroCued(): boolean {
  return cued;
}

/** Test helper. */
export function resetHeroCue(): void {
  cued = false;
  cuedInstant = false;
  listeners.clear();
}
