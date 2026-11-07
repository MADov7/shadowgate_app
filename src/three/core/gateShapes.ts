// Pure 2D geometry for the SHADOW GATE gateway — the chamfered frame of the brand mark (MARK_FRAME) scaled up
// to monument size. All values are in world units, gate-local (x centred, y up from the gate base).
// Shared by the welcome gate (Gate.tsx) and reusable by any other gateway in the world (e.g. the horizon gate).
import { WORLD } from '../worldLayout';

export type P2 = [number, number];

const SQRT2M1 = Math.SQRT2 - 1;

/** Gateway dimensions. The opening echoes the mark: chamfer ≈ 0.31 × width (12.5 / 40 in the 64-unit mark). */
export const GATE = {
  /** Height of the plinth the frame stands on. */
  plinth: 0.34,
  openW: WORLD.gateOpening,
  openH: 4.5,
  openChamfer: 0.98,
  /** Frame thickness (pillars and lintel). */
  frame: 0.86,
  /** Frame depth along Z (excluding bevel). */
  depth: 1.1,
  bevel: 0.05,
  /** Door leaves sit behind the frame, hinged on the back face so they swing away from the viewer. */
  leafThickness: 0.2,
  leafOverlap: 0.1,
  seamGap: 0.028,
  maxSwing: (88 * Math.PI) / 180,
} as const;

export interface UShape {
  /** Inner opening width / height / top-corner chamfer (axis length). */
  w: number;
  h: number;
  c: number;
}

/** The opening offset outward by d (d < 0 shrinks it). Keeps a uniform distance along the 45° chamfers. */
export function offsetOpening(base: UShape, d: number): UShape {
  return { w: base.w + 2 * d, h: base.h + d, c: base.c + d * (2 - Math.SQRT2) };
}

/** Half outline (right side, bottom → top centre) of an opening offset by d. */
export function openingHalfPath(base: UShape, d: number): P2[] {
  const hw = base.w / 2;
  return [
    [hw + d, 0],
    [hw + d, base.h - base.c + d * SQRT2M1],
    [hw - base.c + d * SQRT2M1, base.h + d],
    [0, base.h + d],
  ];
}

/** Mirror a right-hand half path to the left (x → −x). */
export function mirrorX(path: readonly P2[]): P2[] {
  return path.map(([x, y]) => [-x, y] as P2);
}

/**
 * Closed polygon of an inverted-U frame band between the opening offset by `inner` and by `outer`
 * (counter-clockwise, no holes — the band is open at the bottom like a doorway).
 */
export function frameBand(base: UShape, inner: number, outer: number): P2[] {
  const inR = openingHalfPath(base, inner);
  const outR = openingHalfPath(base, outer);
  const pts: P2[] = [];
  // Outer edge: right bottom → right up → top → left down.
  for (let i = 0; i < outR.length - 1; i++) pts.push(outR[i]);
  const outL = mirrorX(outR);
  for (let i = outL.length - 2; i >= 0; i--) pts.push(outL[i]);
  // Inner edge back: left bottom → up → top → right down.
  const inL = mirrorX(inR);
  for (let i = 0; i < inL.length - 1; i++) pts.push(inL[i]);
  for (let i = inR.length - 2; i >= 0; i--) pts.push(inR[i]);
  return pts;
}

/** Signed area (positive = counter-clockwise). */
export function signedArea(pts: readonly P2[]): number {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}

/**
 * One door leaf outline in hinge-local coordinates (hinge at x = 0, leaf extends toward +x = the seam).
 * Follows the chamfered opening and overlaps the frame by `overlap` on the hinge side and top.
 */
export function leafOutline(base: UShape, overlap: number, seamGap: number): P2[] {
  const o = offsetOpening(base, overlap);
  const width = o.w / 2 - seamGap / 2;
  // Hinge side is the outer edge (x = 0 here) → chamfer sits at the hinge-side top corner.
  return [
    [0, 0],
    [width, 0],
    [width, o.h],
    [o.c, o.h],
    [0, o.h - o.c],
  ];
}

/** Total length of a polyline. */
export function pathLength(path: readonly P2[]): number {
  let len = 0;
  for (let i = 1; i < path.length; i++) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  return len;
}
