// Where the 3D data core lands on screen in the hero pose (T = 0, entrance complete) — pure math, no three.js.
// The hero HUD (reticle + telemetry) uses it so the DOM details frame the real core at every aspect ratio
// and in both text directions (the 3D world itself is not mirrored for RTL).
// Mirrors CameraRig: hero CAM_KEYS[0] pose, portrait FOV widening fov · (1 + 0.36 · portrait), capped at 72°.
import { clamp01 } from '../../lib/choreo';
import { CAM_KEYS, WORLD, type Vec3 } from '../../three/worldLayout';

export interface CoreFrame {
  /** Core centre in CSS px from the viewport's physical left / top. */
  x: number;
  y: number;
  /** Projected core diameter in CSS px. */
  d: number;
  /** True when the centre is inside the viewport. */
  onScreen: boolean;
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** Vertical FOV the camera rig uses for a given aspect ratio. */
export function heroFov(baseFov: number, aspect: number): number {
  const portrait = clamp01((1.25 - aspect) / 0.8);
  return Math.min(72, baseFov * (1 + 0.36 * portrait));
}

/** Perspective projection of a world point for a camera at `pos` looking at `look` (world up = +Y). */
export function projectPoint(
  point: Vec3,
  cam: { pos: Vec3; look: Vec3; fov: number },
  width: number,
  height: number,
  radius = 0,
): CoreFrame {
  const f = norm(sub(cam.look, cam.pos));
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const d = sub(point, cam.pos);
  const z = Math.max(1e-4, dot(d, f));
  const tanHalf = Math.tan(((cam.fov * Math.PI) / 180) / 2);
  const aspect = width / Math.max(1, height);
  const ndcX = dot(d, r) / (z * tanHalf * aspect);
  const ndcY = dot(d, u) / (z * tanHalf);
  const x = ((ndcX + 1) / 2) * width;
  const y = ((1 - ndcY) / 2) * height;
  const diameter = ((2 * radius) / (z * tanHalf)) * (height / 2);
  return { x, y, d: diameter, onScreen: x >= 0 && x <= width && y >= 0 && y <= height };
}

/**
 * Set to true once world-core mirrors the hero framing for Arabic (core on the left in RTL) — the HUD then
 * orbits the mirrored core instead of switching to its column layout.
 */
export const HERO_CORE_MIRRORS_IN_RTL = false;

/** The data core in the hero pose for a viewport of `width × height` CSS px (`mirrored` = RTL-mirrored world). */
export function heroCoreFrame(width: number, height: number, mirrored = false): CoreFrame {
  const key = CAM_KEYS[0];
  const fov = heroFov(key.fov, width / Math.max(1, height));
  const f = projectPoint(WORLD.core, { pos: key.pos, look: key.look, fov }, width, height, WORLD.coreRadius);
  return mirrored ? { ...f, x: width - f.x } : f;
}

export type HudLayout = { mode: 'orbit' | 'column'; side: 'left' | 'right' };

/**
 * How the hero HUD frames the core: 'orbit' = reticle + labels around the core, on the core's side;
 * 'column' = the core sits behind the copy (RTL with an unmirrored world), so the labels form a telemetry
 * column on the free side and the reticle is dropped.
 */
export function hudLayout(frame: CoreFrame, width: number, copySide: 'left' | 'right'): HudLayout {
  const coreSide = frame.x >= width / 2 ? 'right' : 'left';
  if (width > 820 && coreSide === copySide) return { mode: 'column', side: copySide === 'right' ? 'left' : 'right' };
  return { mode: 'orbit', side: coreSide };
}
