// Shared, mutable (non-reactive) state for the service constellation (Scene D).
// The DOM drag layer / keyboard writes a bounded yaw target; the 3D group eases toward it every frame and
// drifts gently back to 0 when the visitor stops interacting. Never put this in React state.
import { clamp } from '../lib/choreo';

/** Rotation bound for the drag interaction (radians). */
export const YAW_LIMIT = 0.9;
/** How long after the last input the constellation starts returning to its rest pose. */
export const IDLE_RETURN_MS = 1600;

export interface ConstellationState {
  /** Desired yaw in [-YAW_LIMIT, YAW_LIMIT]. Written by the DOM. */
  yawTarget: number;
  /** Eased yaw actually applied to the 3D group. Written by the 3D scene. */
  yaw: number;
  dragging: boolean;
  /** performance.now() of the last drag / key input. */
  lastInput: number;
  /** Projected on-screen radius (CSS px) of each object, written by the 3D scene for the hotspot reticles. */
  radiusPx: number[];
}

export const constellationState: ConstellationState = {
  yawTarget: 0,
  yaw: 0,
  dragging: false,
  lastInput: -Infinity,
  radiusPx: new Array<number>(8).fill(0),
};

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export function setYawTarget(value: number, at = now(), s: ConstellationState = constellationState): number {
  s.yawTarget = clamp(value, -YAW_LIMIT, YAW_LIMIT);
  s.lastInput = at;
  return s.yawTarget;
}

/** Keyboard nudge (arrow keys on a focused hotspot). */
export function nudgeYaw(delta: number, at = now(), s: ConstellationState = constellationState): number {
  return setYawTarget(s.yawTarget + delta, at, s);
}

export function beginDrag(at = now(), s: ConstellationState = constellationState): void {
  s.dragging = true;
  s.lastInput = at;
}

export function endDrag(at = now(), s: ConstellationState = constellationState): void {
  s.dragging = false;
  s.lastInput = at;
}

/** Frame-rate independent exponential smoothing. */
export function damp(current: number, target: number, lambda: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-lambda * dt));
}

/** Advances the eased yaw by dt seconds (idle → return to rest). Returns the applied yaw. */
export function stepYaw(dt: number, at = now(), s: ConstellationState = constellationState): number {
  if (!s.dragging && at - s.lastInput > IDLE_RETURN_MS) s.yawTarget = damp(s.yawTarget, 0, 1.4, dt);
  s.yaw = damp(s.yaw, s.yawTarget, 6, dt);
  return s.yaw;
}

/** 0..1 emphasis of object i for a continuous focus position (1 = focused, smooth falloff to neighbours). */
export function focusEmphasis(focusFloat: number, i: number): number {
  const e = clamp(1 - Math.abs(focusFloat - i), 0, 1);
  return e * e * (3 - 2 * e);
}

/** Scroll position (px) that puts service i in focus inside a sticky section. */
export function serviceScrollTop(sectionTop: number, sectionHeight: number, viewport: number, i: number, count = 8): number {
  const travel = Math.max(0, sectionHeight - viewport);
  return Math.round(sectionTop + (travel * clamp(i, 0, count - 1)) / Math.max(1, count - 1));
}
