// @vitest-environment node
import { beforeEach, describe, expect, it } from 'vitest';
import { clientIp, hit, resetRateLimits } from './rateLimit';

describe('rate limiter', () => {
  beforeEach(() => resetRateLimits());

  it('allows up to the limit inside a window, then refuses with Retry-After', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i += 1) expect(hit('k', 3, 60_000, t0 + i)).toEqual({ ok: true });
    const refused = hit('k', 3, 60_000, t0 + 10);
    expect(refused.ok).toBe(false);
    if (!refused.ok) expect(refused.retryAfterSeconds).toBe(60);
  });

  it('starts a fresh window after it expires and keeps keys apart', () => {
    const t0 = 2_000_000;
    hit('a', 1, 1_000, t0);
    expect(hit('a', 1, 1_000, t0 + 1).ok).toBe(false);
    expect(hit('b', 1, 1_000, t0 + 1).ok).toBe(true);
    expect(hit('a', 1, 1_000, t0 + 1_001).ok).toBe(true);
  });

  it('reads the visitor IP from proxy headers and ignores garbage', () => {
    const req = (headers: Record<string, string>) => new Request('http://x.test/api/auth/login', { headers });
    expect(clientIp(req({ 'x-nf-client-connection-ip': '203.0.113.7' }))).toBe('203.0.113.7');
    expect(clientIp(req({ 'x-forwarded-for': '198.51.100.2, 10.0.0.1' }))).toBe('198.51.100.2');
    expect(clientIp(req({ 'x-forwarded-for': '<script>' }))).toBe('local');
    expect(clientIp(req({}))).toBe('local');
  });
});
