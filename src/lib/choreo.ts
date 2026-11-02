// THE SCROLL MODEL — one coordinated, reversible timeline for the whole site.
//
// Scroll position (px) is mapped piecewise-linearly onto a continuous world timeline `T` using DOM anchors.
// The 3D scene (camera, particles, layers, constellation) is a pure function of T, so scrolling backwards
// reverses every transition exactly. DOM sections use their own local progress (0..1) for text choreography.
//
//   T 0      hero pose — just passed through the gate, data core ahead
//   T 0→1    particles reorganise from the data core into the globe as the hero scrolls out
//   T 1→2.6  Threat Radar (sticky): globe hold, arcs, gentle drift
//   T 2.6→3  travel to the company network
//   T 3→5    Defense Layers (sticky): five protection layers reveal one by one
//   T 5→5.5  travel to the service constellation (during the simulation section)
//   T 5.5→7.5 Service constellation (sticky): focus moves service by service
//   T 7.5→8.5 parked & dimmed behind catalog / quiz / packages (normal scrolling)
//   T 8.5→9  Build Your Protection: symbolic structure
//   T 9→10   Individuals & contact: the gate opens toward a calm teal horizon

/** DOM section ids, in page order. */
export const SECTION_IDS = {
  hero: 'home',
  radar: 'radar',
  layers: 'layers',
  simulation: 'simulation',
  constellation: 'explore',
  catalog: 'catalog',
  quiz: 'quiz',
  packages: 'packages',
  build: 'build',
  personal: 'personal',
  contact: 'contact',
  brand: 'about-brand',
} as const;

export type AnchorEdge = 'top' | 'end';
/** [section id, edge, T]. 'top' = section top at viewport top; 'end' = section bottom at viewport bottom. */
export const ANCHORS: ReadonlyArray<readonly [string, AnchorEdge, number]> = [
  [SECTION_IDS.hero, 'top', 0],
  [SECTION_IDS.radar, 'top', 1],
  [SECTION_IDS.radar, 'end', 2.6],
  [SECTION_IDS.layers, 'top', 3],
  [SECTION_IDS.layers, 'end', 5],
  [SECTION_IDS.constellation, 'top', 5.5],
  [SECTION_IDS.constellation, 'end', 7.5],
  [SECTION_IDS.catalog, 'top', 8],
  [SECTION_IDS.build, 'top', 8.5],
  [SECTION_IDS.build, 'end', 9],
  [SECTION_IDS.personal, 'top', 9.3],
  [SECTION_IDS.contact, 'top', 10],
];

export const T_MAX = 10;

/** Sticky section heights (CSS), shorter on small screens. */
export const SCROLLY_HEIGHT = {
  radar: { desktop: '230vh', mobile: '170vh' },
  layers: { desktop: '320vh', mobile: '260vh' },
  constellation: { desktop: '300vh', mobile: '240vh' },
  build: { desktop: '160vh', mobile: '130vh' },
} as const;

export interface MeasuredAnchor {
  y: number;
  T: number;
}

/** Piecewise-linear T for a scroll position. Anchors must be sorted by y (measureAnchors guarantees it). */
export function tFromScroll(y: number, anchors: readonly MeasuredAnchor[]): number {
  if (anchors.length === 0) return 0;
  if (y <= anchors[0].y) return anchors[0].T;
  for (let i = 1; i < anchors.length; i++) {
    const a = anchors[i - 1];
    const b = anchors[i];
    if (y <= b.y) {
      const span = b.y - a.y;
      return span <= 0 ? b.T : a.T + ((y - a.y) / span) * (b.T - a.T);
    }
  }
  return anchors[anchors.length - 1].T;
}

/** Reads anchor positions from the DOM. Missing sections are skipped; y is forced monotonic. */
export function measureAnchors(doc: Document = document, viewportHeight = window.innerHeight): MeasuredAnchor[] {
  const out: MeasuredAnchor[] = [];
  let lastY = -Infinity;
  for (const [id, edge, T] of ANCHORS) {
    const el = doc.getElementById(id);
    if (!el) continue;
    const top = el.getBoundingClientRect().top + window.scrollY;
    let y = edge === 'top' ? top : top + el.offsetHeight - viewportHeight;
    if (y <= lastY) y = lastY + 1;
    lastY = y;
    out.push({ y, T });
  }
  return out;
}

// ---------- Shared math ----------
export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const clamp = (v: number, lo: number, hi: number) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 0→1 as x goes a→b (linear, clamped). */
export const range = (a: number, b: number, x: number) => clamp01((x - a) / (b - a));

// ---------- Defense Layers (Scene C) ----------
export const LAYER_ORDER = ['website', 'email', 'cloud', 'accounts', 'ongoing'] as const;
export type LayerKey = (typeof LAYER_ORDER)[number];
const LAYER_INTRO = 0.08;
const LAYER_OUTRO = 0.08;

/** Layers section local progress (0..1) from T. */
export function layersProgressFromT(T: number): number {
  return clamp01((T - 3) / 2);
}

/** -1 during the intro, then 0..4 — the layer currently being explained. */
export function activeLayerIndex(progress: number): number {
  if (progress < LAYER_INTRO) return -1;
  const span = (1 - LAYER_INTRO - LAYER_OUTRO) / LAYER_ORDER.length;
  return Math.min(LAYER_ORDER.length - 1, Math.floor((progress - LAYER_INTRO) / span));
}

/** 0..1 reveal amount for layer i (smooth, for 3D shells). */
export function layerReveal(progress: number, i: number): number {
  const span = (1 - LAYER_INTRO - LAYER_OUTRO) / LAYER_ORDER.length;
  const start = LAYER_INTRO + i * span;
  return smoothstep(start, start + span * 0.6, progress);
}

// ---------- Service constellation (Scene D) ----------
/** Number of objects in the constellation (the 8 business services, in catalog order). */
export const CONSTELLATION_COUNT = 8;

export function constellationProgressFromT(T: number): number {
  return clamp01((T - 5.5) / 2);
}

/** Continuous focus position 0..COUNT-1 (use for smooth 3D motion). */
export function constellationFocusFloat(progress: number): number {
  return clamp01(progress) * (CONSTELLATION_COUNT - 1);
}

/** Discrete focused index (use for DOM text). */
export function constellationFocusIndex(progress: number): number {
  return Math.round(constellationFocusFloat(progress));
}

// ---------- Global canvas visibility ----------
/** Canvas opacity by T: dims behind long reading sections (catalog/quiz/packages) so text stays readable. */
export function canvasOpacityAt(T: number): number {
  if (T < 7.6) return 1;
  if (T < 8.0) return lerp(1, 0.2, smoothstep(7.6, 8.0, T));
  if (T < 8.3) return 0.2;
  if (T < 8.5) return lerp(0.2, 1, smoothstep(8.3, 8.5, T));
  return 1;
}
