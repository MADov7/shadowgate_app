// Maps an order API failure to a translated message key — the server's English error text is never shown.
import type { TKey } from '../i18n';

export function orderErrorKey(status: number, body: { fields?: Record<string, unknown>; unknown?: unknown[] } = {}): TKey {
  if (status === 401) return 'auth.orderSessionExpired';
  if (status === 400 && body.fields && 'authorization' in body.fields) return 'auth.errAuthorization';
  if (status === 400 && Array.isArray(body.unknown) && body.unknown.length > 0) return 'auth.errUnknownProducts';
  if (status === 400) return 'auth.errOrderInvalid';
  if (status === 503) return 'auth.errUnavailable';
  return 'auth.errServer';
}
