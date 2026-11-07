import { describe, expect, it } from 'vitest';
import { heroCoreFrame, heroFov, hudLayout, projectPoint } from './coreFrame';

describe('hudLayout', () => {
  const right = { x: 970, y: 450, d: 550, onScreen: true };
  const left = { x: 470, y: 450, d: 550, onScreen: true };
  it('orbits the core when it sits opposite the copy', () => {
    expect(hudLayout(right, 1440, 'left')).toEqual({ mode: 'orbit', side: 'right' });
    expect(hudLayout(left, 1440, 'right')).toEqual({ mode: 'orbit', side: 'left' });
  });
  it('switches to a telemetry column on the free side when the core is behind the copy', () => {
    expect(hudLayout(right, 1440, 'right')).toEqual({ mode: 'column', side: 'left' });
  });
  it('phones always orbit (copy is full width)', () => {
    expect(hudLayout({ ...right, x: 360 }, 390, 'right')).toEqual({ mode: 'orbit', side: 'right' });
  });
});

describe('projectPoint', () => {
  it('puts the look-at point at the viewport centre', () => {
    const p = projectPoint([0, 0, -10], { pos: [0, 0, 0], look: [0, 0, -10], fov: 45 }, 1200, 800);
    expect(p.x).toBeCloseTo(600, 5);
    expect(p.y).toBeCloseTo(400, 5);
    expect(p.onScreen).toBe(true);
  });
  it('maps right/up in world space to right/up on screen', () => {
    const cam = { pos: [0, 0, 0] as [number, number, number], look: [0, 0, -10] as [number, number, number], fov: 45 };
    const p = projectPoint([2, 1, -10], cam, 1200, 800);
    expect(p.x).toBeGreaterThan(600);
    expect(p.y).toBeLessThan(400);
  });
  it('projects a sphere radius into a diameter that shrinks with distance', () => {
    const cam = { pos: [0, 0, 0] as [number, number, number], look: [0, 0, -1] as [number, number, number], fov: 60 };
    const near = projectPoint([0, 0, -5], cam, 1000, 1000, 1);
    const far = projectPoint([0, 0, -10], cam, 1000, 1000, 1);
    expect(near.d).toBeCloseTo(far.d * 2, 5);
  });
});

describe('heroCoreFrame', () => {
  it('places the core to the right of centre on a desktop viewport, fully visible', () => {
    const f = heroCoreFrame(1440, 900);
    expect(f.onScreen).toBe(true);
    expect(f.x / 1440).toBeGreaterThan(0.55);
    expect(f.x / 1440).toBeLessThan(0.8);
    expect(f.d).toBeGreaterThan(300);
  });
  it('mirrors horizontally for an RTL-mirrored world', () => {
    const a = heroCoreFrame(1440, 900);
    const b = heroCoreFrame(1440, 900, true);
    expect(a.x + b.x).toBeCloseTo(1440, 5);
    expect(b.y).toBeCloseTo(a.y, 5);
  });
  it('widens the FOV on portrait screens (capped)', () => {
    expect(heroFov(45, 16 / 9)).toBe(45);
    expect(heroFov(45, 390 / 844)).toBeGreaterThan(55);
    expect(heroFov(60, 0.2)).toBeLessThanOrEqual(72);
  });
});
