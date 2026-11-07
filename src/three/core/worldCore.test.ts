import { describe, expect, it } from 'vitest';
import {
  GATE,
  frameBand,
  leafOutline,
  offsetOpening,
  openingHalfPath,
  signedArea,
} from './gateShapes';
import { PARTICLE_KIND, buildParticleTargets, globePoints } from './particleTargets';
import { angularDistance, arcLift, writeArc } from './arcMath';
import { doorOpen, flyProgress, gateLight, traceStages } from './entry';
import { angleDelta } from './globeState';
import { HOME_REGION, REGIONS } from '../../lib/geo';

const OPEN = { w: GATE.openW, h: GATE.openH, c: GATE.openChamfer };

describe('gate shapes', () => {
  it('offsets the chamfered opening uniformly', () => {
    const o = offsetOpening(OPEN, 0.5);
    expect(o.w).toBeCloseTo(OPEN.w + 1);
    expect(o.h).toBeCloseTo(OPEN.h + 0.5);
    // Distance between the two parallel 45° chamfer lines equals the offset.
    const inner = openingHalfPath(OPEN, 0);
    const outer = openingHalfPath(OPEN, 0.5);
    const lineC = (p: number[]) => p[0] + p[1];
    expect((lineC(outer[1]) - lineC(inner[1])) / Math.SQRT2).toBeCloseTo(0.5);
  });

  it('builds a simple counter-clockwise frame band', () => {
    const band = frameBand(OPEN, 0, GATE.frame);
    expect(band.length).toBe(12);
    expect(signedArea(band)).toBeGreaterThan(0);
  });

  it('leaf outline spans half the opening plus overlap minus the seam', () => {
    const leaf = leafOutline(OPEN, GATE.leafOverlap, GATE.seamGap);
    expect(leaf[1][0]).toBeCloseTo(OPEN.w / 2 + GATE.leafOverlap - GATE.seamGap / 2);
    expect(signedArea(leaf)).toBeGreaterThan(0);
  });
});

describe('entrance phases', () => {
  it('is closed and dark at entry 0, fully open at 1', () => {
    expect(doorOpen(0)).toBe(0);
    expect(doorOpen(1)).toBeCloseTo(1);
    expect(flyProgress(0)).toBe(0);
    expect(flyProgress(1)).toBe(1);
    expect(traceStages(0)).toEqual({ base: 0, frame: 0, doors: 0 });
    expect(traceStages(0.4)).toEqual({ base: 1, frame: 1, doors: 1 });
    expect(gateLight(0)).toBeGreaterThan(0);
    expect(gateLight(1)).toBeCloseTo(1);
  });

  it('is monotonic (scrubbing backwards reverses)', () => {
    let prev = -1;
    for (let e = 0; e <= 1.0001; e += 0.01) {
      const v = doorOpen(e) + flyProgress(e);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });
});

describe('particle targets', () => {
  it('produces exactly `count` globe points with the land/ocean/ring mix', () => {
    const pts = globePoints(3500);
    expect(pts.length).toBe(3500);
    const land = pts.filter((p) => p.kind === PARTICLE_KIND.land).length;
    expect(land / pts.length).toBeGreaterThan(0.6);
    for (const p of pts.slice(0, 200)) expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(1, 5);
  });

  it('places core and globe targets on their spheres', () => {
    const t = buildParticleTargets(2000, { coreRadius: 3.1, globeRadius: 3.35, seed: 3 });
    expect(t.core.length).toBe(6000);
    for (let i = 0; i < 2000; i += 97) {
      const g = Math.hypot(t.globe[i * 3], t.globe[i * 3 + 1], t.globe[i * 3 + 2]);
      expect(g).toBeCloseTo(3.35, 4);
      const c = Math.hypot(t.core[i * 3], t.core[i * 3 + 1], t.core[i * 3 + 2]);
      expect(c).toBeLessThanOrEqual(3.1 + 1e-4);
      expect(t.rand[i * 4]).toBeGreaterThanOrEqual(0);
      expect(t.rand[i * 4]).toBeLessThanOrEqual(1);
    }
  });

  it('is deterministic for a seed', () => {
    const a = buildParticleTargets(500, { coreRadius: 3, globeRadius: 3, seed: 9 });
    const b = buildParticleTargets(500, { coreRadius: 3, globeRadius: 3, seed: 9 });
    expect(Array.from(a.stream.slice(0, 30))).toEqual(Array.from(b.stream.slice(0, 30)));
  });
});

describe('arc math', () => {
  it('lifts arcs above the surface and lands on the endpoints', () => {
    const from = REGIONS[0];
    const seg = 32;
    const out = new Float32Array((seg + 1) * 3);
    const rad = new Float32Array((seg + 1) * 3);
    const mid = writeArc(from, HOME_REGION, 3.35, seg, out, rad);
    expect(Math.hypot(...mid)).toBeCloseTo(1, 5);
    const r0 = Math.hypot(out[0], out[1], out[2]);
    const rm = Math.hypot(out[(seg / 2) * 3], out[(seg / 2) * 3 + 1], out[(seg / 2) * 3 + 2]);
    expect(r0).toBeCloseTo(3.35 * 1.006, 3);
    expect(rm).toBeGreaterThan(r0 + arcLift(angularDistance(from, HOME_REGION), 3.35) * 0.9);
  });

  it('wraps angle deltas the short way', () => {
    expect(angleDelta(3, -3)).toBeCloseTo(2 * Math.PI - 6);
    expect(angleDelta(0, 1)).toBeCloseTo(1);
  });
});
