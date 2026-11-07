// Screen framing for the later scenes. The camera path (worldLayout CAM_KEYS) is aspect-independent, but the DOM
// panels are not: on wide screens a glass panel covers the start side (left in English, right in Arabic), on
// phones a compact panel covers the bottom. Each scene therefore offsets its own render group so its subject
// lands in the free part of the screen. The WORLD anchors themselves never move.
import { Vector3 } from 'three';
import { sampleCamera, type CamPose, type Vec3 } from '../worldLayout';

export interface FrameTarget {
  /** Desired NDC x of the anchor (−1 left … 1 right), for a left-to-right page. Mirrored for RTL. */
  x: number;
  /** Desired NDC y of the anchor (−1 bottom … 1 top). */
  y: number;
  /** Uniform scale for the group (to fit narrow screens). */
  scale: number;
}

/** Wide desktop / medium / portrait targets, picked by aspect ratio. */
export function pickFrame(aspect: number, wide: FrameTarget, medium: FrameTarget, portrait: FrameTarget): FrameTarget {
  if (aspect >= 1.15) return wide;
  if (aspect >= 0.85) return medium;
  return portrait;
}

/**
 * World-space offset that moves `anchor` from where the reference camera pose (at `refT`) sees it to the target
 * NDC position. Uses the reference pose, not the live camera, so the offset is stable while the camera moves.
 * `fovScale` mirrors CameraRig's portrait FOV widening.
 */
export function framingShift(
  refT: number,
  anchor: Vec3,
  aspect: number,
  target: FrameTarget,
  rtl: boolean,
  out = new Vector3(),
): Vector3 {
  const pose: CamPose = sampleCamera(refT);
  const pos = new Vector3(...pose.pos);
  const forward = new Vector3(...pose.look).sub(pos).normalize();
  const right = new Vector3().crossVectors(forward, new Vector3(0, 1, 0)).normalize();
  const up = new Vector3().crossVectors(right, forward).normalize();
  const rel = new Vector3(...anchor).sub(pos);
  const zc = rel.dot(forward);
  const portrait = Math.min(1, Math.max(0, (1.25 - aspect) / 0.8));
  const tanHalf = Math.tan(((pose.fov * (1 + 0.36 * portrait)) * Math.PI) / 360);
  const ndcX = rel.dot(right) / zc / tanHalf / aspect;
  const ndcY = rel.dot(up) / zc / tanHalf;
  const wantX = rtl ? -target.x : target.x;
  out.copy(right).multiplyScalar((wantX - ndcX) * zc * tanHalf * aspect);
  out.addScaledVector(up, (target.y - ndcY) * zc * tanHalf);
  return out;
}
