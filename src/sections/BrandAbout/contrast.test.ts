import { describe, expect, it } from 'vitest';
import { contrastRating, contrastRatio, hexToRgb, relativeLuminance } from './contrast';

describe('contrast maths', () => {
  it('parses hex colours', () => {
    expect(hexToRgb('#35F2C4')).toEqual([53, 242, 196]);
    expect(hexToRgb('#fff')).toEqual([255, 255, 255]);
  });

  it('matches the WCAG reference values', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
  });

  it('confirms the brand palette is readable on midnight navy', () => {
    const navy = '#070B14';
    expect(contrastRating(contrastRatio('#F3F6FA', navy))).toBe('AAA');
    expect(contrastRating(contrastRatio('#35F2C4', navy))).toBe('AAA');
    expect(contrastRating(contrastRatio('#A9B4C4', navy))).toBe('AAA');
    expect(contrastRatio('#FF4D5E', navy)).toBeGreaterThanOrEqual(4.5);
  });

  it('rates thresholds', () => {
    expect(contrastRating(7)).toBe('AAA');
    expect(contrastRating(4.5)).toBe('AA');
    expect(contrastRating(3.2)).toBe('large');
    expect(contrastRating(2)).toBe('fail');
  });
});
