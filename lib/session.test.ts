import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { signSession, verifySession } from './session';
import { MissingSecretError } from './errors';

const USER = { id: '64b7f0c2a1b2c3d4e5f60718', name: 'Test Student' };

describe('session token (JWT)', () => {
  const original = process.env.JWT_SECRET;
  beforeAll(() => {
    process.env.JWT_SECRET = 'unit-test-secret-that-is-long-enough-for-hs256-signing';
  });
  afterAll(() => {
    process.env.JWT_SECRET = original;
  });

  it('accepts a freshly signed token and returns the user id from the token', () => {
    const result = verifySession(signSession(USER));
    expect(result).toEqual({ ok: true, userId: USER.id, name: USER.name });
  });

  it('expires', () => {
    const token = jwt.sign({ name: USER.name }, process.env.JWT_SECRET!, { subject: USER.id, expiresIn: -10 });
    expect(verifySession(token)).toEqual({ ok: false, reason: 'expired' });
  });

  it('rejects a missing token', () => {
    expect(verifySession(undefined)).toEqual({ ok: false, reason: 'missing' });
    expect(verifySession('')).toEqual({ ok: false, reason: 'missing' });
  });

  it('rejects tampered, foreign-key and malformed tokens', () => {
    const token = signSession(USER);
    const [h, p, s] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: '000000000000000000000000', name: 'x' })).toString('base64url');
    expect(verifySession(`${h}.${forgedPayload}.${s}`)).toEqual({ ok: false, reason: 'invalid' });
    expect(verifySession(jwt.sign({ name: 'x' }, 'a-different-secret', { subject: USER.id }))).toEqual({ ok: false, reason: 'invalid' });
    expect(verifySession('not.a.token')).toEqual({ ok: false, reason: 'invalid' });
    expect(verifySession(`${h}.${p}`)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('rejects the "none" algorithm', () => {
    const unsigned = jwt.sign({ name: 'x', sub: USER.id }, '', { algorithm: 'none' });
    expect(verifySession(unsigned)).toEqual({ ok: false, reason: 'invalid' });
  });

  it('stops with a clear error when JWT_SECRET is missing', () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => signSession(USER)).toThrow(MissingSecretError);
    process.env.JWT_SECRET = saved;
  });
});
