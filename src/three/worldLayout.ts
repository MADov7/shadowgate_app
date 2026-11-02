// World layout + camera path for the single persistent WebGL scene.
// Everything lives along the -Z axis; the camera travels through it as T advances (see src/lib/choreo.ts).
// Scene components MUST build their content around these anchors so the shared camera frames them.
import { CONSTELLATION_COUNT, easeInOutCubic, clamp01 } from '../lib/choreo';

export type Vec3 = [number, number, number];

/** World anchors (units ≈ metres). */
export const WORLD = {
  /** Gateway base centre. Gate is ~5.2 tall, ~3.6 wide opening, faces +Z. */
  gate: [0, 0, 0] as Vec3,
  gateHeight: 5.2,
  gateOpening: 3.6,
  /** Data core / globe centre and radius (particles morph core → globe here). */
  core: [0, 2.6, -16] as Vec3,
  coreRadius: 3.1,
  globeRadius: 3.35,
  /** Company network platform centre (Scene C). Nodes sit on a ring of radius networkRadius. */
  network: [0, 0, -42] as Vec3,
  networkRadius: 4.2,
  /** Service constellation (Scene D): items stacked down a vertical line, see constellationItemPos. */
  constellation: [0, 4, -68] as Vec3,
  constellationSpacing: 2.6,
  /** Build Your Protection symbolic structure (Scene E). */
  build: [0, 0, -92] as Vec3,
  /** Final gate opening toward the horizon (Scene F). */
  horizonGate: [0, 0, -118] as Vec3,
  horizon: [0, 2, -150] as Vec3,
} as const;

/** Position of constellation item i (0 = first business service). Zig-zags left/right like an orbit. */
export function constellationItemPos(i: number): Vec3 {
  const [cx, cy, cz] = WORLD.constellation;
  const side = i % 2 === 0 ? -1 : 1;
  return [cx + side * 1.5, cy - i * WORLD.constellationSpacing, cz + (i % 3) * 0.6 - 0.6];
}

export interface CamKey {
  T: number;
  pos: Vec3;
  look: Vec3;
  fov: number;
}

const last = constellationItemPos(CONSTELLATION_COUNT - 1);
const first = constellationItemPos(0);

/** Camera before entering (welcome page, entry = 0): outside the closed gate. */
export const WELCOME_CAM: CamKey = { T: -1, pos: [0, 2.3, 12.5], look: [0, 2.5, 0], fov: 42 };

/**
 * Camera keyframes by T. Between keys the pose eases in/out, so the camera "settles" on each key —
 * matching the scroll-pinned holds. Tuning these is allowed; keep T values in sync with choreo ANCHORS.
 */
export const CAM_KEYS: readonly CamKey[] = [
  // Hero — just through the gate; the data core floats to the right of the headline.
  { T: 0, pos: [1.4, 2.4, -3.6], look: [-3.0, 2.6, -16], fov: 45 },
  // Radar — the globe sits left of centre so the event feed fits on the right.
  { T: 1, pos: [2.7, 2.9, -8.4], look: [1.25, 2.6, -16], fov: 44 },
  { T: 2.6, pos: [3.1, 3.3, -9.4], look: [1.0, 2.6, -16], fov: 44 },
  // Defense Layers — elevated three-quarter view of the company network.
  { T: 3, pos: [0.5, 9.5, -29.5], look: [0, 0.4, -42], fov: 46 },
  { T: 4, pos: [-2.2, 8.2, -31.5], look: [0, 0.4, -42], fov: 46 },
  { T: 5, pos: [-3.4, 7.4, -32.5], look: [0, 0.4, -42], fov: 46 },
  // Constellation — camera rides down the vertical line, object focus follows scroll.
  { T: 5.5, pos: [5.4, first[1] + 0.3, -59.5], look: [0.6, first[1], -68], fov: 42 },
  { T: 7.5, pos: [5.4, last[1] + 0.3, -59.5], look: [0.6, last[1], -68], fov: 42 },
  // Parked behind catalog / packages (canvas dimmed).
  { T: 8, pos: [7.5, last[1] + 3, -55], look: [0, last[1] + 1, -70], fov: 48 },
  // Build Your Protection.
  { T: 8.5, pos: [0, 3.2, -82.5], look: [0, 2.4, -92], fov: 44 },
  { T: 9, pos: [0, 2.8, -84.5], look: [0, 2.6, -92], fov: 42 },
  // Individuals & contact — facing the final gate and the calm teal horizon beyond it.
  { T: 9.3, pos: [0, 2.4, -104], look: [0, 2.6, -118], fov: 44 },
  { T: 10, pos: [0, 2.3, -110.5], look: [0, 2.7, -130], fov: 46 },
];

function lerpVec(a: Vec3, b: Vec3, t: number, out: Vec3): Vec3 {
  out[0] = a[0] + (b[0] - a[0]) * t;
  out[1] = a[1] + (b[1] - a[1]) * t;
  out[2] = a[2] + (b[2] - a[2]) * t;
  return out;
}

export interface CamPose {
  pos: Vec3;
  look: Vec3;
  fov: number;
}

/** Camera pose for a given T (no allocation if `out` is supplied). */
export function sampleCamera(T: number, out: CamPose = { pos: [0, 0, 0], look: [0, 0, 0], fov: 45 }): CamPose {
  const keys = CAM_KEYS;
  if (T <= keys[0].T) {
    lerpVec(keys[0].pos, keys[0].pos, 0, out.pos);
    lerpVec(keys[0].look, keys[0].look, 0, out.look);
    out.fov = keys[0].fov;
    return out;
  }
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (T <= b.T) {
      const u = easeInOutCubic(clamp01((T - a.T) / (b.T - a.T)));
      lerpVec(a.pos, b.pos, u, out.pos);
      lerpVec(a.look, b.look, u, out.look);
      out.fov = a.fov + (b.fov - a.fov) * u;
      return out;
    }
  }
  const z = keys[keys.length - 1];
  lerpVec(z.pos, z.pos, 0, out.pos);
  lerpVec(z.look, z.look, 0, out.look);
  out.fov = z.fov;
  return out;
}

/**
 * Entrance choreography phases on scrollState.entry (0 → 1, ~2.8 s, driven by the welcome overlay):
 *   0.00–0.35 light traces the gateway edges
 *   0.25–0.65 the two gate leaves swing open
 *   0.45–1.00 the camera moves through the opening into the hero pose
 */
export const ENTRY_PHASES = {
  trace: [0, 0.35],
  open: [0.25, 0.65],
  fly: [0.45, 1],
} as const;
