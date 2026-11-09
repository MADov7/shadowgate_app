/**
 * Post-login destination guard (prevents open redirects). Accepts only same-site relative paths:
 *  - must start with a single "/" (not "//"),
 *  - no control characters or whitespace (browsers strip tab/newline, so "/\t/evil.com" would become "//evil.com"),
 *  - no backslashes,
 *  - and it must still resolve to the same origin when parsed as a URL.
 */
const BASE = 'http://same-origin.invalid';

export function safeNext(value: string | null | undefined, fallback = '/orders'): string {
  if (!value || typeof value !== 'string') return fallback;
  // eslint-disable-next-line no-control-regex
  if (/[\u0000- \u007f\\]/.test(value) || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const url = new URL(value, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
