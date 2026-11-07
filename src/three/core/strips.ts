// Flat, mitered ribbon geometry for glowing edge lines (the gateway "light trace").
// Each vertex carries aU — the normalized arc length along its path — so a shader can draw the line progressively.
import { BufferAttribute, BufferGeometry } from 'three';
import type { P2 } from './gateShapes';

export interface StripPath {
  points: readonly P2[];
  /** Optional per-point draw parameter (0..1). Defaults to normalized arc length. */
  u?: readonly number[];
}

/**
 * Builds one geometry holding several flat ribbons lying in the plane z = `z` (facing +Z).
 * `width` is the full ribbon width in world units.
 */
export function buildStrips(paths: readonly StripPath[], width: number, z: number): BufferGeometry {
  let vCount = 0;
  let iCount = 0;
  for (const p of paths) {
    vCount += p.points.length * 2;
    iCount += (p.points.length - 1) * 6;
  }
  const pos = new Float32Array(vCount * 3);
  const uv = new Float32Array(vCount * 2);
  const index = new Uint32Array(iCount);
  let v = 0;
  let ii = 0;
  const half = width / 2;
  for (const path of paths) {
    const pts = path.points;
    const n = pts.length;
    // Arc length parameter.
    let us: number[];
    if (path.u) us = path.u.slice();
    else {
      us = [0];
      let acc = 0;
      for (let i = 1; i < n; i++) {
        acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
        us.push(acc);
      }
      const total = acc || 1;
      us = us.map((x) => x / total);
    }
    const base = v;
    for (let i = 0; i < n; i++) {
      const prev = pts[Math.max(0, i - 1)];
      const next = pts[Math.min(n - 1, i + 1)];
      const cur = pts[i];
      // Segment normals on either side of this vertex.
      const n0 = segNormal(i > 0 ? prev : cur, i > 0 ? cur : next);
      const n1 = segNormal(i < n - 1 ? cur : prev, i < n - 1 ? next : cur);
      let mx = n0[0] + n1[0];
      let my = n0[1] + n1[1];
      const ml = Math.hypot(mx, my) || 1;
      mx /= ml;
      my /= ml;
      const dot = Math.max(0.25, mx * n0[0] + my * n0[1]);
      const len = half / dot;
      for (const s of [1, -1]) {
        pos[v * 3] = cur[0] + mx * len * s;
        pos[v * 3 + 1] = cur[1] + my * len * s;
        pos[v * 3 + 2] = z;
        uv[v * 2] = us[i];
        uv[v * 2 + 1] = s > 0 ? 1 : 0;
        v++;
      }
    }
    for (let i = 0; i < n - 1; i++) {
      const a = base + i * 2;
      index[ii++] = a;
      index[ii++] = a + 1;
      index[ii++] = a + 2;
      index[ii++] = a + 1;
      index[ii++] = a + 3;
      index[ii++] = a + 2;
    }
  }
  const normal = new Float32Array(vCount * 3);
  for (let i = 0; i < vCount; i++) normal[i * 3 + 2] = 1;
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('normal', new BufferAttribute(normal, 3));
  // uv.x = draw parameter, uv.y = across the ribbon (0..1) for soft edges.
  g.setAttribute('uv', new BufferAttribute(uv, 2));
  g.setIndex(new BufferAttribute(index, 1));
  g.computeBoundingSphere();
  return g;
}

function segNormal(a: P2, b: P2): [number, number] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [-dy / l, dx / l];
}
