// Safe wrappers around Web Storage: private windows, blocked cookies and quota errors must never crash the UI.
type Area = 'local' | 'session';

function area(kind: Area): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T, kind: Area = 'local'): T {
  try {
    const raw = area(kind)?.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown, kind: Area = 'local'): boolean {
  try {
    area(kind)?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readString(key: string, kind: Area = 'local'): string | null {
  try {
    return area(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function writeString(key: string, value: string, kind: Area = 'local'): void {
  try {
    area(kind)?.setItem(key, value);
  } catch {
    /* storage unavailable — feature degrades to in-memory only */
  }
}

export function removeKey(key: string, kind: Area = 'local'): void {
  try {
    area(kind)?.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Storage keys used across the app (single place so docs/tests can reference them). */
export const KEYS = {
  entered: 'sg-entered', // sessionStorage: welcome shown once per browser session
  sound: 'sg-sound', // sessionStorage: '1' when the visitor turned ambient sound on
  lang: 'sg-lang', // localStorage: 'en' | 'ar'
  motion: 'sg-motion', // localStorage: 'system' | 'full' | 'reduced'
  basket: 'sg-basket-v1', // localStorage: request basket (zustand persist)
  requests: 'sg-demo-requests', // localStorage: demo request submissions
  bookings: 'sg-demo-bookings', // localStorage: demo personal-service bookings
} as const;
