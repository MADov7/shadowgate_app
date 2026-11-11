// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { authErrorCode, cleanEnvValue, isUniqueViolation, isUuid, normalizeSupabaseUrl, supabaseHeaders, supabaseKeyKind } from './supabaseCore';

/** Builds FAKE keys at runtime (no key-like literal in the source, so secret scanners stay quiet). */
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const fakeJwtKey = (role: string) => [b64({ alg: 'HS256', typ: 'JWT' }), b64({ iss: 'supabase', role }), 'c2lnbmF0dXJlLW5vdC1jaGVja2Vk'].join('.');
const fakeNewKey = (kind: string) => ['sb', kind, 'AbCdEfGhIjKlMnOpQrSt'].join('_');

describe('Supabase settings clean-up', () => {
  it('strips quotes, spaces and a NAME= prefix from pasted values', () => {
    expect(cleanEnvValue('  "https://abc.supabase.co"\r\n')).toBe('https://abc.supabase.co');
    expect(cleanEnvValue('SUPABASE_URL=https://abc.supabase.co')).toBe('https://abc.supabase.co');
    expect(cleanEnvValue("'x'")).toBe('x');
    expect(cleanEnvValue('   ')).toBeUndefined();
    expect(cleanEnvValue(undefined)).toBeUndefined();
  });
  it('accepts only https project URLs (or a local stack)', () => {
    expect(normalizeSupabaseUrl('https://abcdefgh.supabase.co/')).toBe('https://abcdefgh.supabase.co');
    expect(normalizeSupabaseUrl('https://abcdefgh.supabase.co/rest/v1')).toBe('https://abcdefgh.supabase.co');
    expect(normalizeSupabaseUrl('http://localhost:54321')).toBe('http://localhost:54321');
    expect(normalizeSupabaseUrl('http://abcdefgh.supabase.co')).toBeNull();
    expect(normalizeSupabaseUrl('https://evil.example.com')).toBeNull();
    expect(normalizeSupabaseUrl('not a url')).toBeNull();
  });
});

describe('Supabase key kinds (server key never mistaken for the public one)', () => {
  it('recognises new and legacy keys', () => {
    expect(supabaseKeyKind(fakeNewKey('publishable'))).toBe('publishable');
    expect(supabaseKeyKind(fakeNewKey('secret'))).toBe('secret');
    expect(supabaseKeyKind(fakeJwtKey('anon'))).toBe('anon');
    expect(supabaseKeyKind(fakeJwtKey('service_role'))).toBe('service_role');
    expect(supabaseKeyKind(fakeJwtKey('authenticated'))).toBe('unknown');
    expect(supabaseKeyKind('garbage')).toBe('unknown');
    expect(supabaseKeyKind(undefined)).toBe('unknown');
  });
  it('sends legacy JWT keys as Bearer too, new keys in apikey only', () => {
    const legacy = fakeJwtKey('anon');
    expect(supabaseHeaders(legacy)).toEqual({ apikey: legacy, Authorization: `Bearer ${legacy}` });
    const fresh = fakeNewKey('publishable');
    expect(supabaseHeaders(fresh)).toEqual({ apikey: fresh });
  });
});

describe('small helpers', () => {
  it('accepts only UUIDs as user / order ids', () => {
    expect(isUuid('3f6c1a2e-8b4d-4c1e-9a7f-2b5d8e9c0a11')).toBe(true);
    expect(isUuid('6650f0c2a1b2c3d4e5f60718')).toBe(false); // an old MongoDB id
    expect(isUuid('3f6c1a2e-8b4d-4c1e-9a7f-2b5d8e9c0a11,or=1')).toBe(false);
    expect(isUuid(42)).toBe(false);
  });
  it('detects unique violations and auth error codes', () => {
    expect(isUniqueViolation(409, { code: '23505' })).toBe(true);
    expect(isUniqueViolation(400, { code: '23505' })).toBe(true);
    expect(isUniqueViolation(409, { code: '23503' })).toBe(false); // foreign-key violation is a 409 too
    expect(isUniqueViolation(400, { code: '22P02' })).toBe(false);
    expect(authErrorCode({ code: 422, error_code: 'email_exists' })).toBe('email_exists');
    expect(authErrorCode({ error: 'invalid_grant' })).toBe('invalid_grant');
    expect(authErrorCode(null)).toBe('');
  });
});
