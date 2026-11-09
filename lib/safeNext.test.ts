import { describe, expect, it } from 'vitest';
import { safeNext } from './safeNext';

describe('safeNext (post-login redirect guard)', () => {
  it('keeps same-site paths, including query and hash', () => {
    expect(safeNext('/orders')).toBe('/orders');
    expect(safeNext('/#contact')).toBe('/#contact');
    expect(safeNext('/orders/64b7f0c2a1b2c3d4e5f60718?x=1')).toBe('/orders/64b7f0c2a1b2c3d4e5f60718?x=1');
  });
  it('falls back for empty or non-relative values', () => {
    expect(safeNext(undefined)).toBe('/orders');
    expect(safeNext('')).toBe('/orders');
    expect(safeNext('orders')).toBe('/orders');
    expect(safeNext('https://evil.com')).toBe('/orders');
    expect(safeNext('javascript:alert(1)')).toBe('/orders');
  });
  it('blocks protocol-relative and backslash tricks', () => {
    expect(safeNext('//evil.com')).toBe('/orders');
    expect(safeNext('/\\evil.com')).toBe('/orders');
    expect(safeNext('/\\/evil.com')).toBe('/orders');
  });
  it('blocks control characters that browsers strip (tab / newline / carriage return)', () => {
    expect(safeNext('/\t/evil.com')).toBe('/orders');
    expect(safeNext('/\n/evil.com')).toBe('/orders');
    expect(safeNext('/\r/evil.com')).toBe('/orders');
    expect(safeNext('/ /evil.com')).toBe('/orders');
  });
});
