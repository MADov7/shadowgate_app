// 12-second brand advertisement — the world state for every frame (pure function of time).
// Hook → Product → Benefit → Brand → CTA, rendered from the site's own 3D world.
// Overlay text/timing comes from ad-package/overlays.json so the render and the Flow package never drift apart.
import { clamp01, easeInOutCubic, lerp, range, smoothstep } from '../lib/choreo';
import overlays from '../../ad-package/overlays.json';

export const FPS = 24;
export const DURATION = 12;
export const TOTAL_FRAMES = FPS * DURATION; // 288

export type Segment = 'gate' | 'network' | 'build' | 'horizon';

export interface AdWorldState {
  segment: Segment;
  T: number;
  entry: number;
  /** Request-basket line items shown by the symbolic build structure (0..9). */
  basketCount: number;
  /** Red threat pulse travel 0..1 (hook). */
  pulse: number;
  /** Red impact flash 0..1. */
  impact: number;
  /** Teal-white light flash used on cuts 0..1. */
  flash: number;
  /** Black dip 0..1. */
  black: number;
  /** Extra darkening behind the logo 0..1. */
  darken: number;
}

const CUT_NETWORK = 3.4;
const CUT_BUILD = 7.96;
const CUT_HORIZON = 10;

export function worldAt(t: number): AdWorldState {
  const s: AdWorldState = {
    segment: 'gate',
    T: 0,
    // Past the gate segment the visitor has "entered": the camera follows T, not the welcome pose.
    entry: 1,
    basketCount: 0,
    pulse: 0,
    impact: 0,
    flash: 0,
    black: 0,
    darken: 0,
  };

  if (t < CUT_NETWORK) {
    // HOOK (0–2 s): a red pulse races toward the sealed gateway and strikes its seam.
    // PRODUCT (2–3.4 s): the gate's edges light teal, the leaves open and we pass through.
    s.segment = 'gate';
    s.pulse = range(0.12, 1.62, t);
    s.impact = t < 1.62 ? 0 : Math.max(0, 1 - (t - 1.62) / 0.55);
    s.entry = easeInOutCubic(range(1.9, CUT_NETWORK, t));
    // Light builds as the camera nears the opening (Noddal-style light tunnel into the cut).
    s.flash = smoothstep(3.05, CUT_NETWORK, t) * 0.85;
    s.black = 1 - smoothstep(0, 0.22, t);
  } else if (t < CUT_BUILD) {
    // PRODUCT (3.4–5 s): website, email and account nodes of a company network, still exposed.
    // BENEFIT (5–8 s): teal protection layers form around the network and stop the red path.
    s.segment = 'network';
    s.T = t < 5 ? lerp(2.98, 3.14, range(CUT_NETWORK, 5, t)) : lerp(3.14, 4.98, easeInOutCubic(range(5, 7.8, t)));
    s.flash = 1 - smoothstep(CUT_NETWORK, CUT_NETWORK + 0.32, t);
    s.black = smoothstep(7.7, CUT_BUILD, t);
  } else if (t < CUT_HORIZON) {
    // BRAND (8–10 s): the symbolic gate assembles and the real mark resolves over it.
    s.segment = 'build';
    s.T = lerp(8.62, 8.96, range(CUT_BUILD, CUT_HORIZON, t));
    s.basketCount = Math.min(9, Math.floor(range(8.05, 9.2, t) * 9 + 1e-6));
    s.black = 1 - smoothstep(CUT_BUILD, 8.25, t);
    s.darken = smoothstep(8.35, 8.9, t) * 0.5;
    s.flash = smoothstep(9.82, CUT_HORIZON, t) * 0.6;
  } else {
    // CTA (10–12 s): the final gateway opens toward a calm teal horizon.
    s.segment = 'horizon';
    s.T = lerp(9.32, 10, easeInOutCubic(range(CUT_HORIZON, 11.85, t)));
    s.flash = (1 - smoothstep(CUT_HORIZON, CUT_HORIZON + 0.35, t)) * 0.6;
    s.darken = 0.18;
    s.black = smoothstep(11.75, 12, t) * 0.0; // hold the last frame clean (no fade to black)
  }
  return s;
}

// ---------- Overlays (from ad-package/overlays.json) ----------
export type Aspect = '16x9' | '9x16';
export type AdLang = 'en' | 'ar';

interface CueFrames {
  frame: number;
}
interface RawCue {
  id: string;
  slug: string;
  kind: 'lines' | 'stacked' | 'lockup' | 'cta' | 'slogan';
  text: Record<AdLang, string>;
  in: CueFrames;
  out: CueFrames;
  fadeInFrames?: number;
  fadeOutFrames?: number;
  lines?: Record<Aspect, Record<AdLang, string[]>>;
  style?: Record<Aspect, Record<AdLang, { sizePctOfFrameHeight: number; weight: number; lineHeight: number }>>;
}

export const CUES: RawCue[] = (overlays as unknown as { cues: RawCue[] }).cues;

/** 0..1 visibility of a cue at a frame (fade in/out by frame counts; "out" is exclusive). */
export function cueAlpha(cue: RawCue, frame: number): number {
  const fi = cue.fadeInFrames ?? 6;
  const fo = cue.fadeOutFrames ?? 6;
  if (frame < cue.in.frame || frame >= cue.out.frame) return 0;
  const a = fi > 0 ? clamp01((frame - cue.in.frame + 1) / fi) : 1;
  // The last cue block holds to the final frame (no fade-out at the very end of the film).
  const holdToEnd = cue.out.frame >= TOTAL_FRAMES;
  const b = holdToEnd || fo <= 0 ? 1 : clamp01((cue.out.frame - frame) / fo);
  return Math.min(a, b);
}

/** Local 0..1 progress through a cue (for draw-on animations). */
export function cueProgress(cue: RawCue, frame: number): number {
  return clamp01((frame - cue.in.frame) / Math.max(1, cue.out.frame - cue.in.frame));
}
