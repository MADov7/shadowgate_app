// Eight distinct faceted metallic shells for the service constellation (Hamol-inspired, original geometry):
// each closed polyhedron is split into separate plates with thin gaps, so the teal core light inside shows
// through the seams. Order matches BUSINESS_SERVICE_IDS.
import {
  BufferGeometry,
  DodecahedronGeometry,
  IcosahedronGeometry,
  LatheGeometry,
  OctahedronGeometry,
  TetrahedronGeometry,
  TorusGeometry,
  Vector2,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { facetPlates } from './geometry';

function lathe(profile: [number, number][], segments: number): BufferGeometry {
  return new LatheGeometry(
    profile.map(([r, y]) => new Vector2(r, y)),
    segments,
  );
}

function stellaOctangula(size: number): BufferGeometry {
  const a = new TetrahedronGeometry(size, 0);
  const b = new TetrahedronGeometry(size, 0);
  b.rotateY(Math.PI / 2);
  b.rotateX(Math.PI);
  // Polyhedron geometries are already non-indexed; only convert if that ever changes.
  const flat = (g: BufferGeometry) => (g.index ? g.toNonIndexed() : g);
  return mergeGeometries([flat(a), flat(b)]) ?? a;
}

/** Raw (un-split) shell geometry for service index i, roughly radius 0.85. */
export function rawShell(i: number): BufferGeometry {
  switch (i % 8) {
    case 0: // Website assessment — icosahedron
      return new IcosahedronGeometry(0.9, 0);
    case 1: {
      // Penetration testing — elongated octahedron (a precise, pointed probe)
      const g = new OctahedronGeometry(0.78, 0);
      g.scale(1, 1.38, 1);
      return g;
    }
    case 2: // Email & accounts — dodecahedron
      return new DodecahedronGeometry(0.86, 0);
    case 3: // Awareness — two interlocked tetrahedra (a team)
      return stellaOctangula(1.02);
    case 4: // E-commerce — faceted hexagonal gem
      return lathe(
        [
          [0.0001, -0.92],
          [0.62, -0.42],
          [0.84, 0.08],
          [0.6, 0.52],
          [0.0001, 0.78],
        ],
        6,
      );
    case 5: {
      // Backup & recovery — a faceted ring (the recovery cycle)
      const g = new TorusGeometry(0.62, 0.27, 4, 8);
      g.rotateX(Math.PI / 2.6);
      return g;
    }
    case 6: // Consultation — geodesic sphere (many viewpoints)
      return new IcosahedronGeometry(0.86, 1);
    default:
      // Monthly review — brilliant-cut gem
      return lathe(
        [
          [0.0001, -0.9],
          [0.82, 0.1],
          [0.6, 0.46],
          [0.0001, 0.52],
        ],
        8,
      );
  }
}

/** Plate-split shell (gap fraction tuned per form so seams read similarly). */
export function shellGeometry(i: number): BufferGeometry {
  const raw = rawShell(i);
  const gap = i % 8 === 6 ? 0.16 : i % 8 === 5 ? 0.1 : 0.085;
  const g = facetPlates(raw, gap);
  raw.dispose();
  return g;
}
