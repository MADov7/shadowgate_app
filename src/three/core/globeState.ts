// Shared, non-reactive globe orientation. GlobeRig writes it once per frame (before anything else renders);
// ParticleField (globe dots) and ThreatArcs (arcs group) read the same rotation so they never drift apart.
import { Euler, Matrix3, Matrix4, Vector3 } from 'three';

export const GLOBE_TILT = 0.3;

export const globeState = {
  /** Current yaw (radians) — rotation about +Y of the globe group. */
  rotY: 0,
  tilt: GLOBE_TILT,
  /** Globe-local unit direction the camera should face (the selected arc's midpoint) or null. */
  focus: null as Vector3 | null,
  /** Local → world rotation for shaders (matches an Object3D with rotation (tilt, rotY, 0), order XYZ). */
  matrix: new Matrix3(),
  euler: new Euler(GLOBE_TILT, 0, 0, 'XYZ'),
};

const m4 = new Matrix4();

/** Recompute the rotation matrix after rotY / tilt change. */
export function syncGlobeMatrix(): void {
  globeState.euler.set(globeState.tilt, globeState.rotY, 0, 'XYZ');
  m4.makeRotationFromEuler(globeState.euler);
  globeState.matrix.setFromMatrix4(m4);
}

/** Shortest signed angle from a to b (radians, −π..π). */
export function angleDelta(a: number, b: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
