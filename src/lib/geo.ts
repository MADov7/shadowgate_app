// Geography helpers shared by the 3D globe and the 2D (static) radar map.
// All locations are ILLUSTRATIVE region centroids — they never imply verified attacker attribution.
import { LANDMASK_B64, LANDMASK_H, LANDMASK_W } from './landmask';
import { mulberry32 } from './random';

let maskBytes: Uint8Array | null = null;
function mask(): Uint8Array {
  if (!maskBytes) {
    const bin = atob(LANDMASK_B64);
    maskBytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) maskBytes[i] = bin.charCodeAt(i);
  }
  return maskBytes;
}

/** True when the 1° cell containing (lat, lon) is land. */
export function isLand(lat: number, lon: number): boolean {
  const row = Math.min(LANDMASK_H - 1, Math.max(0, Math.floor(90 - lat)));
  let col = Math.floor(lon + 180) % LANDMASK_W;
  if (col < 0) col += LANDMASK_W;
  const i = row * LANDMASK_W + col;
  return (mask()[i >> 3] & (1 << (i & 7))) !== 0;
}

/** Sphere position for lat/lon in degrees. lon 0 faces +Z, north is +Y. */
export function latLonToVec3(lat: number, lon: number, radius = 1): [number, number, number] {
  const phi = (lat * Math.PI) / 180;
  const lambda = (lon * Math.PI) / 180;
  const c = Math.cos(phi);
  return [radius * c * Math.sin(lambda), radius * Math.sin(phi), radius * c * Math.cos(lambda)];
}

export interface GeoDot {
  lat: number;
  lon: number;
  land: boolean;
}

/**
 * Evenly distributed points on a sphere (Fibonacci lattice) classified as land/ocean.
 * `count` is the lattice size; land density ≈ 30% of it (Antarctica included).
 */
export function fibonacciDots(count: number): GeoDot[] {
  const dots: GeoDot[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const theta = golden * i;
    const lat = (Math.asin(y) * 180) / Math.PI;
    let lon = ((theta * 180) / Math.PI) % 360;
    if (lon > 180) lon -= 360;
    dots.push({ lat, lon, land: isLand(lat, lon) });
  }
  return dots;
}

/** Random land points (seeded) — handy for scattering markers. */
export function randomLandPoints(n: number, seed = 7): { lat: number; lon: number }[] {
  const rand = mulberry32(seed);
  const out: { lat: number; lon: number }[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 200) {
    const lat = (Math.asin(rand() * 2 - 1) * 180) / Math.PI;
    const lon = rand() * 360 - 180;
    if (lat > -58 && isLand(lat, lon)) out.push({ lat, lon });
  }
  return out;
}

export interface Region {
  id: string;
  lat: number;
  lon: number;
  label: { en: string; ar: string };
}

/** Illustrative region centroids used by the simulated radar. Not attribution. */
export const REGIONS: readonly Region[] = [
  { id: 'na-west', lat: 39, lon: -118, label: { en: 'North America (West)', ar: 'أمريكا الشمالية (الغرب)' } },
  { id: 'na-east', lat: 40, lon: -78, label: { en: 'North America (East)', ar: 'أمريكا الشمالية (الشرق)' } },
  { id: 'latam', lat: -15, lon: -55, label: { en: 'South America', ar: 'أمريكا الجنوبية' } },
  { id: 'eu-west', lat: 48, lon: 3, label: { en: 'Western Europe', ar: 'أوروبا الغربية' } },
  { id: 'eu-north', lat: 59, lon: 18, label: { en: 'Northern Europe', ar: 'أوروبا الشمالية' } },
  { id: 'eu-east', lat: 50, lon: 28, label: { en: 'Eastern Europe', ar: 'أوروبا الشرقية' } },
  { id: 'gulf', lat: 26, lon: 50, label: { en: 'Gulf Region', ar: 'منطقة الخليج' } },
  { id: 'n-africa', lat: 28, lon: 10, label: { en: 'North Africa', ar: 'شمال أفريقيا' } },
  { id: 's-africa', lat: -26, lon: 26, label: { en: 'Southern Africa', ar: 'جنوب أفريقيا' } },
  { id: 's-asia', lat: 21, lon: 78, label: { en: 'South Asia', ar: 'جنوب آسيا' } },
  { id: 'e-asia', lat: 34, lon: 115, label: { en: 'East Asia', ar: 'شرق آسيا' } },
  { id: 'se-asia', lat: 4, lon: 108, label: { en: 'Southeast Asia', ar: 'جنوب شرق آسيا' } },
  { id: 'oceania', lat: -27, lon: 140, label: { en: 'Oceania', ar: 'أوقيانوسيا' } },
] as const;

/** The (illustrative) protected network the demo arcs travel towards. */
export const HOME_REGION: Region = {
  id: 'home',
  lat: 29.4,
  lon: 47.9,
  label: { en: 'Demo network (illustrative)', ar: 'شبكة العرض التوضيحي (توضيحية)' },
};

export function regionById(id: string): Region | undefined {
  return id === HOME_REGION.id ? HOME_REGION : REGIONS.find((r) => r.id === id);
}

/** Great-circle interpolation between two lat/lon points; t in [0,1]. */
export function slerpLatLon(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  t: number,
): [number, number, number] {
  const va = latLonToVec3(a.lat, a.lon, 1);
  const vb = latLonToVec3(b.lat, b.lon, 1);
  const dot = Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-5) return va;
  const s = Math.sin(omega);
  const wa = Math.sin((1 - t) * omega) / s;
  const wb = Math.sin(t * omega) / s;
  return [va[0] * wa + vb[0] * wb, va[1] * wa + vb[1] * wb, va[2] * wa + vb[2] * wb];
}
