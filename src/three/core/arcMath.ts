// Pure great-circle arc math for the simulated threat arcs (globe-local, unrotated coordinates).
import { latLonToVec3, slerpLatLon } from '../../lib/geo';

export interface LatLon {
  lat: number;
  lon: number;
}

/** Angular distance (radians) between two lat/lon points. */
export function angularDistance(a: LatLon, b: LatLon): number {
  const va = latLonToVec3(a.lat, a.lon, 1);
  const vb = latLonToVec3(b.lat, b.lon, 1);
  const d = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  return Math.acos(d);
}

/** Peak height of an arc above the surface: longer arcs lift higher so they read clearly over the globe. */
export function arcLift(omega: number, radius: number): number {
  return radius * (0.035 + 0.26 * (omega / Math.PI));
}

/**
 * Writes `segments + 1` points of a lifted great-circle arc into `out` (xyz triplets) and the unit radial
 * direction of each point into `radial`. Returns the arc's midpoint direction (unit, globe-local).
 */
export function writeArc(
  from: LatLon,
  to: LatLon,
  radius: number,
  segments: number,
  out: Float32Array,
  radial: Float32Array,
): [number, number, number] {
  const omega = angularDistance(from, to);
  const lift = arcLift(omega, radius);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const d = slerpLatLon(from, to, t);
    const l = Math.hypot(d[0], d[1], d[2]) || 1;
    const nx = d[0] / l;
    const ny = d[1] / l;
    const nz = d[2] / l;
    const r = radius * 1.006 + lift * Math.sin(Math.PI * t);
    out[i * 3] = nx * r;
    out[i * 3 + 1] = ny * r;
    out[i * 3 + 2] = nz * r;
    radial[i * 3] = nx;
    radial[i * 3 + 1] = ny;
    radial[i * 3 + 2] = nz;
  }
  const m = slerpLatLon(from, to, 0.5);
  const ml = Math.hypot(m[0], m[1], m[2]) || 1;
  return [m[0] / ml, m[1] / ml, m[2] / ml];
}
