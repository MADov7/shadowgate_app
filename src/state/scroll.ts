// Mutable, non-reactive scroll/choreography state shared by the DOM scroll system and the 3D scene.
// Written by src/lib/smoothScroll.ts every scroll tick and by the welcome entrance; read in useFrame.
// Never put this in React state — it changes every frame.
export const scrollState = {
  /** window scrollY in px */
  y: 0,
  /** viewport height in px */
  vh: 800,
  /** Continuous world timeline position (see src/lib/choreo.ts ANCHORS). Reversible: a pure function of scroll. */
  T: 0,
  /** Signed scroll velocity (px/s, smoothed). */
  velocity: 0,
  /** 0 = standing outside the closed gate (welcome), 1 = entered (hero). Driven by the entrance animation. */
  entry: 0,
  /** Pointer position in NDC (-1..1), for gentle camera parallax. */
  pointerX: 0,
  pointerY: 0,
};
