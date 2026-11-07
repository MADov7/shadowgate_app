// Local demo persistence for the request form and the booking dialog — there is NO backend.
// Records are written to localStorage only (KEYS.requests / KEYS.bookings) so the visitor can see the flow
// end-to-end; nothing is ever sent anywhere. Also hosts small pure helpers shared by the conversion scenes.
import type { Lang, PackageId, Pricing, ServiceId } from '../data/types';
import { getPackage } from '../data/packages';
import { getService } from '../data/services';
import { KEYS, readJSON, removeKey, writeJSON } from './storage';
import type { ContactMethod, CustomerType, SessionFormat } from './validation';

// ---------- Build Your Protection: symbolic structure ----------
/** The symbolic structure has nine segments (Scene E, DOM meter + static SVG + 3D structure). */
export const STRUCTURE_SEGMENTS = 9;

/** One segment per selected service, plus one for the package — capped at nine. */
export function structureSegmentCount(serviceCount: number, hasPackage: boolean): number {
  return Math.max(0, Math.min(STRUCTURE_SEGMENTS, serviceCount + (hasPackage ? 1 : 0)));
}

/** True when any requested service (directly or through the package) needs ownership / written authorization. */
export function requestNeedsAuthorization(serviceIds: readonly ServiceId[], packageId: PackageId | null): boolean {
  const all = [...serviceIds, ...(packageId ? getPackage(packageId).includes : [])];
  return all.some((id) => getService(id).requiresAuthorization === true);
}

/**
 * "$39" in both languages (Latin digits, matching the rest of the UI). The Arabic ICU pattern ("39 US$") reorders to
 * "$US 39" inside RTL text, whereas "$39" stays one unit under the bidi rules ($ binds to the digits that follow it).
 */
export function formatAmount(amount: number, _lang: Lang): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

/** Illustrative amount + unit for display, or null when the service is quote-based. */
export function illustrativeParts(pricing: Pricing, lang: Lang): { amount: string; per: string } | null {
  if (pricing.kind !== 'illustrative') return null;
  return { amount: formatAmount(pricing.amount, lang), per: pricing.per[lang] };
}

// ---------- Reference ids ----------
/** No 0/O, 1/I/L — references stay readable when copied by hand. */
const REF_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function secureRandom(): number {
  try {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] / 0x1_0000_0000;
  } catch {
    return Math.random();
  }
}

/** Local demo reference, e.g. "SG-DEMO-7KQ4". Not a real booking or ticket number. */
export function makeReference(random: () => number = secureRandom): string {
  let code = '';
  for (let i = 0; i < 4; i++) code += REF_ALPHABET[Math.floor(random() * REF_ALPHABET.length) % REF_ALPHABET.length];
  return `SG-DEMO-${code}`;
}

export const REFERENCE_PATTERN = /^SG-DEMO-[A-HJ-NP-Z2-9]{4}$/;

// ---------- Records ----------
/** Keep the newest N records so a demo browser never accumulates unbounded data. */
export const MAX_STORED = 25;

export interface DemoRequestRecord {
  reference: string;
  createdAt: string;
  lang: Lang;
  packageId: PackageId | null;
  serviceIds: ServiceId[];
  customerType: CustomerType;
  contactMethod: ContactMethod;
  fullName: string;
  email: string;
  organisation: string;
  phone: string;
  message: string;
  /** Recorded only when an authorization-requiring service was in the request. */
  authorizationConfirmed: boolean;
}

export interface DemoBookingRecord {
  reference: string;
  createdAt: string;
  lang: Lang;
  serviceId: ServiceId;
  date: string;
  time: string;
  format: SessionFormat;
  name: string;
  email: string;
  notes: string;
}

export interface SaveResult<T> {
  record: T;
  /** False when storage is unavailable (private mode, blocked site data, quota). */
  persisted: boolean;
}

function readList<T extends { reference: string }>(key: string): T[] {
  const raw = readJSON<unknown>(key, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is T => typeof r === 'object' && r !== null && typeof (r as { reference?: unknown }).reference === 'string',
  );
}

function uniqueReference(taken: ReadonlySet<string>, random?: () => number): string {
  let ref = makeReference(random);
  for (let i = 0; i < 20 && taken.has(ref); i++) ref = makeReference(random);
  return ref;
}

function save<T extends { reference: string; createdAt: string }>(
  key: string,
  input: Omit<T, 'reference' | 'createdAt'>,
  now: Date,
  random?: () => number,
): SaveResult<T> {
  const existing = readList<T>(key);
  const taken = new Set([...listRequests(), ...listBookings()].map((r) => r.reference));
  const record = { ...input, reference: uniqueReference(taken, random), createdAt: now.toISOString() } as T;
  const persisted = writeJSON(key, [record, ...existing].slice(0, MAX_STORED));
  return { record, persisted };
}

export function listRequests(): DemoRequestRecord[] {
  return readList<DemoRequestRecord>(KEYS.requests);
}

export function listBookings(): DemoBookingRecord[] {
  return readList<DemoBookingRecord>(KEYS.bookings);
}

export function saveRequest(
  input: Omit<DemoRequestRecord, 'reference' | 'createdAt'>,
  now: Date = new Date(),
  random?: () => number,
): SaveResult<DemoRequestRecord> {
  return save<DemoRequestRecord>(KEYS.requests, input, now, random);
}

export function saveBooking(
  input: Omit<DemoBookingRecord, 'reference' | 'createdAt'>,
  now: Date = new Date(),
  random?: () => number,
): SaveResult<DemoBookingRecord> {
  return save<DemoBookingRecord>(KEYS.bookings, input, now, random);
}

/** Removes every saved demo request and booking from this browser (basket and preferences are untouched). */
export function clearDemoData(): void {
  removeKey(KEYS.requests);
  removeKey(KEYS.bookings);
}

// ---------- Booking slots (generated locally — no real calendar) ----------
/** Illustrative session start times. */
export const BOOKING_TIMES = ['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'] as const;

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar date as YYYY-MM-DD (no UTC shift). */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Parses YYYY-MM-DD (+ optional HH:MM) as a LOCAL date. */
export function fromISODate(iso: string, time = '00:00'): Date {
  const [y, m, d] = iso.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}

/** The next `count` weekdays (Mon–Fri) after `from` — today is never offered. */
export function upcomingWeekdays(from: Date, count = 10): string[] {
  const out: string[] = [];
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  while (out.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) out.push(toISODate(cursor));
  }
  return out;
}

function intlLocale(lang: Lang): string {
  return lang === 'ar' ? 'ar-u-nu-latn-ca-gregory' : 'en-GB';
}

export function formatDayParts(iso: string, lang: Lang): { weekday: string; day: string; month: string; full: string } {
  const date = fromISODate(iso);
  const loc = intlLocale(lang);
  return {
    weekday: new Intl.DateTimeFormat(loc, { weekday: 'short' }).format(date),
    day: new Intl.DateTimeFormat(loc, { day: 'numeric' }).format(date),
    month: new Intl.DateTimeFormat(loc, { month: 'short' }).format(date),
    full: new Intl.DateTimeFormat(loc, { weekday: 'long', day: 'numeric', month: 'long' }).format(date),
  };
}

export function formatSlot(time: string, lang: Lang): string {
  const date = fromISODate('2026-01-05', time);
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en-US', { hour: 'numeric', minute: '2-digit' }).format(
    date,
  );
}
