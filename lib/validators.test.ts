import { describe, expect, it } from 'vitest';
import { validateLogin, validateOrderInput, validateSignup } from './validators';

describe('sign-up validation (server)', () => {
  it('accepts a valid sign-up and normalises the email', () => {
    const r = validateSignup({ name: '  Sara   Ali ', email: ' Sara@Example.COM ', password: 'longenough1' });
    expect(r).toEqual({ ok: true, data: { name: 'Sara Ali', email: 'sara@example.com', password: 'longenough1' } });
  });
  it('requires every field', () => {
    expect(validateSignup({})).toEqual({ ok: false, errors: { name: 'required', email: 'required', password: 'required' } });
  });
  it('checks email format and the 8-character password minimum', () => {
    const r = validateSignup({ name: 'A', email: 'not-an-email', password: 'short' });
    expect(r).toEqual({ ok: false, errors: { email: 'invalid', password: 'tooShort' } });
  });
  it('rejects passwords longer than bcrypt can use (72 bytes)', () => {
    const r = validateSignup({ name: 'A', email: 'a@b.co', password: 'x'.repeat(73) });
    expect(r.ok).toBe(false);
  });
});

describe('log-in validation (server)', () => {
  it('requires a valid email and a password', () => {
    expect(validateLogin({ email: 'x', password: '' })).toEqual({ ok: false, errors: { email: 'invalid', password: 'required' } });
    expect(validateLogin({ email: 'A@B.co', password: 'whatever' })).toEqual({ ok: true, data: { email: 'a@b.co', password: 'whatever' } });
  });
});

describe('order validation (server)', () => {
  it('accepts slugs + quantities and ignores a user id, prices or totals sent by the browser', () => {
    const r = validateOrderInput({
      user: '000000000000000000000000',
      total: 1,
      items: [{ slug: 'consultation', quantity: 2, price: 0.01 }],
      message: ' hi ',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data).toEqual({ items: [{ slug: 'consultation', quantity: 2 }], packageSlug: null, requestType: 'business', organisation: '', phone: '', message: 'hi', authorizationConfirmed: false });
      expect(r.data).not.toHaveProperty('user');
      expect(r.data).not.toHaveProperty('total');
    }
  });
  it('rejects empty orders, bad quantities, duplicates and unknown packages', () => {
    expect(validateOrderInput({ items: [] }).ok).toBe(false);
    expect(validateOrderInput({ items: [{ slug: 'consultation', quantity: 0 }] }).ok).toBe(false);
    expect(validateOrderInput({ items: [{ slug: 'consultation', quantity: 11 }] }).ok).toBe(false);
    expect(validateOrderInput({ items: [{ slug: 'consultation', quantity: 1.5 }] }).ok).toBe(false);
    expect(validateOrderInput({ items: [{ slug: 'a', quantity: 1 }, { slug: 'a', quantity: 1 }] }).ok).toBe(false);
    expect(validateOrderInput({ items: [], packageSlug: 'gold' }).ok).toBe(false);
    expect(validateOrderInput({ items: [], packageSlug: 'foundation' }).ok).toBe(true);
  });
});
