import { beforeEach, describe, expect, it } from 'vitest';
import { KEYS } from './storage';
import {
  MAX_STORED,
  REFERENCE_PATTERN,
  STRUCTURE_SEGMENTS,
  clearDemoData,
  formatAmount,
  fromISODate,
  listBookings,
  listRequests,
  makeReference,
  requestNeedsAuthorization,
  saveBooking,
  saveRequest,
  structureSegmentCount,
  toISODate,
  upcomingWeekdays,
} from './requests';

const request = {
  lang: 'en' as const,
  packageId: null,
  serviceIds: ['website-assessment' as const],
  customerType: 'business' as const,
  contactMethod: 'email' as const,
  fullName: 'Layla Haddad',
  email: 'layla@example.com',
  organisation: '',
  phone: '',
  message: 'Please review our website.',
  authorizationConfirmed: false,
};

beforeEach(() => localStorage.clear());

describe('structureSegmentCount', () => {
  it('counts services plus the package, capped at nine', () => {
    expect(structureSegmentCount(0, false)).toBe(0);
    expect(structureSegmentCount(3, true)).toBe(4);
    expect(structureSegmentCount(8, true)).toBe(STRUCTURE_SEGMENTS);
    expect(structureSegmentCount(12, true)).toBe(STRUCTURE_SEGMENTS);
  });
});

describe('requestNeedsAuthorization', () => {
  it('is true only when pen-testing is requested', () => {
    expect(requestNeedsAuthorization(['website-assessment'], null)).toBe(false);
    expect(requestNeedsAuthorization(['website-assessment', 'pen-testing'], null)).toBe(true);
    expect(requestNeedsAuthorization([], 'business')).toBe(false);
  });
});

describe('makeReference', () => {
  it('produces SG-DEMO-XXXX with unambiguous characters', () => {
    for (let i = 0; i < 200; i++) expect(makeReference()).toMatch(REFERENCE_PATTERN);
    expect(makeReference(() => 0)).toBe('SG-DEMO-AAAA');
    expect(makeReference(() => 0.9999999)).toBe('SG-DEMO-9999');
  });
});

describe('demo persistence', () => {
  it('saves requests newest-first under KEYS.requests', () => {
    const first = saveRequest(request, new Date('2026-11-02T10:00:00Z'));
    const second = saveRequest({ ...request, fullName: 'Omar' }, new Date('2026-11-02T11:00:00Z'));
    expect(first.persisted).toBe(true);
    expect(first.record.reference).toMatch(REFERENCE_PATTERN);
    expect(listRequests().map((r) => r.fullName)).toEqual(['Omar', 'Layla Haddad']);
    expect(JSON.parse(localStorage.getItem(KEYS.requests) ?? '[]')).toHaveLength(2);
    expect(second.record.createdAt).toBe('2026-11-02T11:00:00.000Z');
  });

  it('avoids reference collisions', () => {
    let calls = 0;
    // First two references collide ("AAAA"), the generator must retry.
    const random = () => (calls++ < 8 ? 0 : 0.5);
    const a = saveRequest(request, new Date(), random);
    const b = saveRequest(request, new Date(), random);
    expect(a.record.reference).toBe('SG-DEMO-AAAA');
    expect(b.record.reference).not.toBe(a.record.reference);
  });

  it('keeps at most MAX_STORED records', () => {
    for (let i = 0; i < MAX_STORED + 5; i++) saveRequest({ ...request, fullName: `N${i}` });
    expect(listRequests()).toHaveLength(MAX_STORED);
    expect(listRequests()[0].fullName).toBe(`N${MAX_STORED + 4}`);
  });

  it('ignores corrupted storage', () => {
    localStorage.setItem(KEYS.requests, '{"not":"a list"}');
    expect(listRequests()).toEqual([]);
    localStorage.setItem(KEYS.bookings, '[1, null, {"reference": "SG-DEMO-ABCD"}]');
    expect(listBookings()).toHaveLength(1);
  });

  it('saves bookings and clears all demo data', () => {
    saveBooking({
      lang: 'ar',
      serviceId: 'device-review',
      date: '2026-11-03',
      time: '09:00',
      format: 'online',
      name: 'Omar',
      email: 'omar@example.com',
      notes: '',
    });
    saveRequest(request);
    expect(listBookings()).toHaveLength(1);
    localStorage.setItem(KEYS.basket, '{"keep":true}');
    clearDemoData();
    expect(listBookings()).toEqual([]);
    expect(listRequests()).toEqual([]);
    expect(localStorage.getItem(KEYS.basket)).not.toBeNull();
  });
});

describe('upcomingWeekdays', () => {
  it('returns the next 10 weekdays, never today or weekends', () => {
    // Monday 2 Nov 2026
    const days = upcomingWeekdays(new Date(2026, 10, 2, 15, 30));
    expect(days).toHaveLength(10);
    expect(days[0]).toBe('2026-11-03');
    expect(days).not.toContain('2026-11-02');
    expect(days).not.toContain('2026-11-07');
    expect(days).not.toContain('2026-11-08');
    expect(days[9]).toBe('2026-11-16');
    for (const d of days) expect([1, 2, 3, 4, 5]).toContain(fromISODate(d).getDay());
  });

  it('starts on Monday when asked on a Friday or weekend', () => {
    expect(upcomingWeekdays(new Date(2026, 10, 6))[0]).toBe('2026-11-09');
    expect(upcomingWeekdays(new Date(2026, 10, 8))[0]).toBe('2026-11-09');
  });

  it('crosses month and year boundaries', () => {
    const days = upcomingWeekdays(new Date(2026, 11, 30), 3);
    expect(days).toEqual(['2026-12-31', '2027-01-01', '2027-01-04']);
  });

  it('round-trips local ISO dates', () => {
    expect(toISODate(fromISODate('2026-03-29'))).toBe('2026-03-29');
  });
});

describe('formatAmount', () => {
  it('renders a symbol-first amount (one bidi unit inside Arabic text) in both languages', () => {
    expect(formatAmount(39, 'en')).toBe('$39');
    expect(formatAmount(39, 'ar')).toBe('$39');
    expect(formatAmount(1200, 'ar')).toBe('$1,200');
  });
});
