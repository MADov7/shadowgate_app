// Procedural geometry helpers shared by the later scenes (pure three.js, no React).
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  Material,
  Mesh,
  Object3D,
  Shape,
  Vector2,
  Vector3,
} from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

/**
 * Hex/pent "Goldberg" wireframe on a sphere: the dual of a subdivided icosahedron (each edge joins the
 * centroids of the two triangles that share it). `keep` can drop segments (e.g. keep the upper hemisphere).
 */
export function goldbergWire(detail: number, radius: number, keep?: (a: Vector3, b: Vector3) => boolean): BufferGeometry {
  let ico: BufferGeometry = new IcosahedronGeometry(1, detail);
  ico.deleteAttribute('normal');
  ico.deleteAttribute('uv');
  ico = mergeVertices(ico, 1e-4);
  const pos = ico.getAttribute('position');
  const index = ico.getIndex();
  if (!index) return new BufferGeometry();
  const faces = index.count / 3;
  const centroids: Vector3[] = [];
  const edges = new Map<string, number[]>();
  const va = new Vector3();
  const vb = new Vector3();
  const vc = new Vector3();
  for (let f = 0; f < faces; f++) {
    const a = index.getX(f * 3);
    const b = index.getX(f * 3 + 1);
    const c = index.getX(f * 3 + 2);
    va.fromBufferAttribute(pos, a);
    vb.fromBufferAttribute(pos, b);
    vc.fromBufferAttribute(pos, c);
    centroids.push(va.clone().add(vb).add(vc).normalize().multiplyScalar(radius));
    for (const [p, q] of [
      [a, b],
      [b, c],
      [c, a],
    ]) {
      const key = p < q ? `${p}_${q}` : `${q}_${p}`;
      const list = edges.get(key);
      if (list) list.push(f);
      else edges.set(key, [f]);
    }
  }
  const out: number[] = [];
  for (const list of edges.values()) {
    if (list.length !== 2) continue;
    const p = centroids[list[0]];
    const q = centroids[list[1]];
    if (keep && !keep(p, q)) continue;
    out.push(p.x, p.y, p.z, q.x, q.y, q.z);
  }
  ico.dispose();
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(out, 3));
  return g;
}

/**
 * Splits a closed mesh into separate flat plates (one per planar face) shrunk toward their own centre, leaving
 * thin gaps that reveal whatever is inside (the teal core light). `gap` = 0..1 fraction of shrink.
 */
export function facetPlates(source: BufferGeometry, gap = 0.1): BufferGeometry {
  const g = source.index ? source.toNonIndexed() : source.clone();
  const pos = g.getAttribute('position') as BufferAttribute;
  const tris = pos.count / 3;
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const n = new Vector3();
  const e1 = new Vector3();
  const e2 = new Vector3();
  const groups = new Map<string, { sum: Vector3; count: number; tris: number[] }>();
  const triCentroid: Vector3[] = [];
  for (let t = 0; t < tris; t++) {
    a.fromBufferAttribute(pos, t * 3);
    b.fromBufferAttribute(pos, t * 3 + 1);
    c.fromBufferAttribute(pos, t * 3 + 2);
    e1.subVectors(b, a);
    e2.subVectors(c, a);
    n.crossVectors(e1, e2);
    const area = n.length();
    if (area < 1e-9) {
      triCentroid.push(a.clone());
      continue;
    }
    n.divideScalar(area);
    const centroid = a.clone().add(b).add(c).divideScalar(3);
    triCentroid.push(centroid);
    const d = n.dot(centroid);
    const key = `${Math.round(n.x * 40)}_${Math.round(n.y * 40)}_${Math.round(n.z * 40)}_${Math.round(d * 30)}`;
    const grp = groups.get(key);
    if (grp) {
      grp.sum.addScaledVector(centroid, area);
      grp.count += area;
      grp.tris.push(t);
    } else {
      groups.set(key, { sum: centroid.clone().multiplyScalar(area), count: area, tris: [t] });
    }
  }
  const v = new Vector3();
  for (const grp of groups.values()) {
    const centre = grp.sum.divideScalar(grp.count);
    for (const t of grp.tris) {
      for (let k = 0; k < 3; k++) {
        v.fromBufferAttribute(pos, t * 3 + k);
        v.lerp(centre, gap);
        pos.setXYZ(t * 3 + k, v.x, v.y, v.z);
      }
    }
  }
  pos.needsUpdate = true;
  g.deleteAttribute('normal');
  g.computeVertexNormals();
  return g;
}

/** Circle polyline (closed) in the XZ plane, radius 1 — scale it to size. */
export function circlePoints(segments = 96): BufferGeometry {
  const pts: number[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(Math.cos(a), 0, Math.sin(a));
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pts, 3));
  return g;
}

/** Regular polygon outline (closed) in the XZ plane. */
export function polygonPoints(sides: number, radius: number, y = 0, rotation = 0): BufferGeometry {
  const pts: number[] = [];
  for (let i = 0; i <= sides; i++) {
    const a = rotation + (i / sides) * Math.PI * 2;
    pts.push(Math.cos(a) * radius, y, Math.sin(a) * radius);
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(pts, 3));
  return g;
}

/** Rounded rectangle shape centred on (cx, cy). */
export function roundedRect(w: number, h: number, r: number, cx = 0, cy = 0): Shape {
  const s = new Shape();
  const x = cx - w / 2;
  const y = cy - h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function polygonShape(points: ReadonlyArray<readonly [number, number]>): Shape {
  return new Shape(points.map(([x, y]) => new Vector2(x, y)));
}

/**
 * Outer and inner outlines of a chamfered gateway frame (the brand mark's silhouette), open at the bottom.
 * Returns the 6 outer and 6 inner points, left foot → right foot. Inner = outer offset inward by `t`.
 */
export function chamferFramePoints(w: number, h: number, c: number, t: number, y0 = 0) {
  const k = t * (Math.SQRT2 - 1);
  const hw = w / 2;
  const outer: [number, number][] = [
    [-hw, y0],
    [-hw, y0 + h - c],
    [-hw + c, y0 + h],
    [hw - c, y0 + h],
    [hw, y0 + h - c],
    [hw, y0],
  ];
  const inner: [number, number][] = [
    [-hw + t, y0],
    [-hw + t, y0 + h - c - k],
    [-hw + c + k, y0 + h - t],
    [hw - c - k, y0 + h - t],
    [hw - t, y0 + h - c - k],
    [hw - t, y0],
  ];
  return { outer, inner };
}

/** A box spanning two points in the XY plane (for glowing "bars": S paths, envelope seams…). */
export function barBetween(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  thickness: number,
  depth: number,
  material: Material,
  z = 0,
): Mesh {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const mesh = new Mesh(new BoxGeometry(len + thickness, thickness, depth), material);
  mesh.position.set((x1 + x2) / 2, (y1 + y2) / 2, z);
  mesh.rotation.z = Math.atan2(dy, dx);
  return mesh;
}

/** Disposes every geometry and material under an object (materials may be shared — disposing twice is safe). */
export function disposeObject(root: Object3D): void {
  root.traverse((o) => {
    const m = o as Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as Material | Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}
