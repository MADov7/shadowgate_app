// Pure generation of the per-particle morph targets used by ParticleField:
//   stream — slow data stream drifting toward / through the gateway (world space, animated in the shader)
//   core   — the "data core" sphere (core-local)
//   globe  — dotted-land globe: land dots + sparse ocean dots + faint lat/long rings (globe-local, unrotated)
// Core and globe targets are paired along a shared space-filling order, so the core → globe morph reads as
// particles flowing into place rather than random teleporting.
import { fibonacciDots } from '../../lib/geo';
import { mulberry32 } from '../../lib/random';

export const PARTICLE_KIND = { land: 0, ocean: 1, ring: 2 } as const;

export interface ParticleTargets {
  count: number;
  /** x0, y0, phase — the shader advances phase over time along −Z. */
  stream: Float32Array;
  core: Float32Array;
  globe: Float32Array;
  /** stagger (0..1), size factor, phase seed, kind. */
  rand: Float32Array;
  /** globe brightness, core brightness. */
  bright: Float32Array;
}

export const PARTICLE_COUNTS = { high: 14000, medium: 8000, low: 3500 } as const;

const DEG = Math.PI / 180;

interface Dir {
  x: number;
  y: number;
  z: number;
}

function dirFromLatLon(lat: number, lon: number): Dir {
  const phi = lat * DEG;
  const lambda = lon * DEG;
  const c = Math.cos(phi);
  return { x: c * Math.sin(lambda), y: Math.sin(phi), z: c * Math.cos(lambda) };
}

/** Evenly pick `n` items from `items` (stable order). */
function evenPick<T>(items: readonly T[], n: number): T[] {
  if (n >= items.length) return items.slice();
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(items[Math.floor(((i + 0.5) * items.length) / n)]);
  return out;
}

/** Boustrophedon latitude-band order: a cheap space-filling ordering of sphere directions. */
function sphereKey(d: Dir, bands = 18): number {
  const lat = Math.asin(Math.max(-1, Math.min(1, d.y)));
  const band = Math.min(bands - 1, Math.floor(((lat / Math.PI + 0.5) * bands)));
  let lon = Math.atan2(d.x, d.z) / (Math.PI * 2) + 0.5; // 0..1
  if (band % 2 === 1) lon = 1 - lon;
  return band + lon * 0.999;
}

export interface GlobePoint extends Dir {
  kind: number;
}

/** Globe-local unit directions for `count` particles: land / ocean / ring mix. */
export function globePoints(count: number): GlobePoint[] {
  const landN = Math.round(count * 0.68);
  const oceanN = Math.round(count * 0.17);
  const ringN = Math.max(0, count - landN - oceanN);

  // Land: oversample the Fibonacci lattice, keep land (Antarctica trimmed for a cleaner silhouette), thin evenly.
  let lattice = Math.ceil(landN / 0.24);
  let land = fibonacciDots(lattice).filter((d) => d.land && d.lat > -60);
  while (land.length < landN && lattice < 400000) {
    lattice = Math.ceil(lattice * 1.4);
    land = fibonacciDots(lattice).filter((d) => d.land && d.lat > -60);
  }
  const landPts = evenPick(land, landN).map((d) => ({ ...dirFromLatLon(d.lat, d.lon), kind: PARTICLE_KIND.land }));

  const ocean = fibonacciDots(Math.ceil(oceanN / 0.55)).filter((d) => !d.land && d.lat > -62 && d.lat < 80);
  const oceanPts = evenPick(ocean, oceanN).map((d) => ({ ...dirFromLatLon(d.lat, d.lon), kind: PARTICLE_KIND.ocean }));

  // Rings: 5 latitude circles + 8 meridians, points proportional to length.
  const lats = [-60, -30, 0, 30, 60];
  const lons = [0, 45, 90, 135, 180, 225, 270, 315];
  const latLen = lats.map((l) => 2 * Math.PI * Math.cos(l * DEG));
  const merLen = Math.PI * (150 / 180); // meridians stop short of the poles (±75°)
  const total = latLen.reduce((a, b) => a + b, 0) + merLen * lons.length;
  const ringPts: GlobePoint[] = [];
  lats.forEach((lat, i) => {
    const n = Math.round((latLen[i] / total) * ringN);
    for (let k = 0; k < n; k++) ringPts.push({ ...dirFromLatLon(lat, (k / n) * 360 - 180), kind: PARTICLE_KIND.ring });
  });
  lons.forEach((lon) => {
    const n = Math.round((merLen / total) * ringN);
    for (let k = 0; k < n; k++) ringPts.push({ ...dirFromLatLon(-75 + (150 * (k + 0.5)) / n, lon), kind: PARTICLE_KIND.ring });
  });
  // Pad / trim rings so the total is exact.
  while (ringPts.length < ringN) ringPts.push({ ...dirFromLatLon(0, ringPts.length * 7.3), kind: PARTICLE_KIND.ring });
  ringPts.length = ringN;

  return [...landPts, ...oceanPts, ...ringPts];
}

/** Builds every morph target for `count` particles (deterministic for a given seed). */
export function buildParticleTargets(count: number, opts: { coreRadius: number; globeRadius: number; seed?: number }): ParticleTargets {
  const rand = mulberry32(opts.seed ?? 1234);
  const stream = new Float32Array(count * 3);
  const core = new Float32Array(count * 3);
  const globe = new Float32Array(count * 3);
  const rnd = new Float32Array(count * 4);
  const bright = new Float32Array(count * 2);

  const gpts = globePoints(count);

  // Core: uniform Fibonacci shell (82%) + interior volume (18%).
  const shellN = Math.round(count * 0.82);
  const corePts: Array<Dir & { r: number; inner: boolean }> = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < shellN; i++) {
    const y = 1 - (i / Math.max(1, shellN - 1)) * 2;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const th = golden * i;
    corePts.push({ x: Math.cos(th) * rr, y, z: Math.sin(th) * rr, r: 0.93 + rand() * 0.07, inner: false });
  }
  for (let i = shellN; i < count; i++) {
    const u = rand() * 2 - 1;
    const th = rand() * Math.PI * 2;
    const rr = Math.sqrt(1 - u * u);
    corePts.push({ x: Math.cos(th) * rr, y: u, z: Math.sin(th) * rr, r: 0.18 + Math.cbrt(rand()) * 0.66, inner: true });
  }

  // Pair core ↔ globe along the same space-filling order.
  const gOrder = gpts.map((p, i) => ({ i, k: sphereKey(p) })).sort((a, b) => a.k - b.k);
  const cOrder = corePts.map((p, i) => ({ i, k: sphereKey(p) + (p.inner ? rand() * 0.5 : 0) })).sort((a, b) => a.k - b.k);

  for (let n = 0; n < count; n++) {
    const g = gpts[gOrder[n].i];
    const c = corePts[cOrder[n].i];
    const R = opts.globeRadius;
    globe[n * 3] = g.x * R;
    globe[n * 3 + 1] = g.y * R;
    globe[n * 3 + 2] = g.z * R;
    const cr = opts.coreRadius * c.r;
    core[n * 3] = c.x * cr;
    core[n * 3 + 1] = c.y * cr;
    core[n * 3 + 2] = c.z * cr;

    // Stream: lanes spread across the approach to the gate, denser near the centre and the floor.
    const side = rand() < 0.5 ? -1 : 1;
    const spread = rand() < 0.62 ? Math.pow(rand(), 1.6) * 4.2 : 2 + rand() * 9;
    stream[n * 3] = side * spread;
    stream[n * 3 + 1] = 0.25 + Math.pow(rand(), 1.35) * 7.2;
    stream[n * 3 + 2] = rand();

    // Stagger: the reorganisation sweeps north → south with per-particle jitter.
    const sweep = 1 - (g.y + 1) / 2;
    const sparkle = rand();
    rnd[n * 4] = Math.min(1, sweep * 0.62 + rand() * 0.38);
    rnd[n * 4 + 1] = 0.65 + rand() * 0.7;
    rnd[n * 4 + 2] = rand();
    rnd[n * 4 + 3] = g.kind;

    bright[n * 2] =
      g.kind === PARTICLE_KIND.land ? (sparkle > 0.97 ? 2.4 : 0.8 + rand() * 0.35) : g.kind === PARTICLE_KIND.ocean ? 0.2 : 0.14;
    bright[n * 2 + 1] = c.inner ? 0.26 : sparkle > 0.955 ? 2.1 : 0.42 + rand() * 0.28;
  }
  return { count, stream, core, globe, rand: rnd, bright };
}
