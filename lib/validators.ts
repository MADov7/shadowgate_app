// Server-side input validation for the auth and order API routes (the browser validates too, but the server
// never trusts it). Errors are codes the UI translates: required | invalid | tooShort | tooLong | taken.
import { isValidEmail } from '@/src/lib/validation';
import { isPackageId } from '@/src/data/packages';

export type FieldError = 'required' | 'invalid' | 'tooShort' | 'tooLong' | 'taken';
export type Result<T, K extends string> = { ok: true; data: T } | { ok: false; errors: Partial<Record<K, FieldError>> };

export const PASSWORD_MIN = 8;
/** bcrypt only uses the first 72 bytes of a password, so longer ones are rejected instead of silently cut. */
export const PASSWORD_MAX_BYTES = 72;
export const NAME_MAX = 80;
export const MAX_ORDER_LINES = 20;
export const MAX_QUANTITY = 10;

const str = (v: unknown) => (typeof v === 'string' ? v : '');

export function normalizeEmail(raw: unknown): string {
  return str(raw).trim().toLowerCase();
}

export function validateSignup(body: unknown): Result<{ name: string; email: string; password: string }, 'name' | 'email' | 'password'> {
  const b = (body ?? {}) as Record<string, unknown>;
  const name = str(b.name).trim().replace(/\s+/g, ' ');
  const email = normalizeEmail(b.email);
  const password = str(b.password);
  const errors: Partial<Record<'name' | 'email' | 'password', FieldError>> = {};
  if (!name) errors.name = 'required';
  else if (name.length > NAME_MAX) errors.name = 'tooLong';
  if (!email) errors.email = 'required';
  else if (!isValidEmail(email)) errors.email = 'invalid';
  if (!password) errors.password = 'required';
  else if (password.length < PASSWORD_MIN) errors.password = 'tooShort';
  else if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) errors.password = 'tooLong';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: { name, email, password } };
}

export function validateLogin(body: unknown): Result<{ email: string; password: string }, 'email' | 'password'> {
  const b = (body ?? {}) as Record<string, unknown>;
  const email = normalizeEmail(b.email);
  const password = str(b.password);
  const errors: Partial<Record<'email' | 'password', FieldError>> = {};
  if (!email) errors.email = 'required';
  else if (!isValidEmail(email)) errors.email = 'invalid';
  if (!password) errors.password = 'required';
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: { email, password } };
}

export interface OrderInput {
  items: Array<{ slug: string; quantity: number }>;
  packageSlug: string | null;
  requestType: 'business' | 'personal';
  organisation: string;
  phone: string;
  message: string;
  /** The visitor confirmed ownership / written authorization (required for penetration testing). */
  authorizationConfirmed: boolean;
}

/**
 * Order request from the browser: product slugs + quantities and optional request details. Anything else in the
 * body — including any user id — is ignored; prices and totals are never accepted from the browser.
 */
/** Cart lines from the browser: well-formed unique slugs with integer quantities 1–10 (null = invalid). */
function parseItems(raw: unknown): OrderInput['items'] | null {
  const rawItems = Array.isArray(raw) ? raw : [];
  const items: OrderInput['items'] = [];
  const seen = new Set<string>();
  for (const entry of rawItems) {
    const r = (entry ?? {}) as Record<string, unknown>;
    const slug = str(r.slug).trim().toLowerCase();
    const quantity = typeof r.quantity === 'number' ? r.quantity : Number(r.quantity);
    if (!/^[a-z0-9-]{2,64}$/.test(slug) || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY || seen.has(slug)) return null;
    seen.add(slug);
    items.push({ slug, quantity });
  }
  return items;
}

export function validateOrderInput(body: unknown): Result<OrderInput, 'items' | 'packageSlug' | 'message'> {
  const b = (body ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<'items' | 'packageSlug' | 'message', FieldError>> = {};
  const parsed = parseItems(b.items);
  if (!parsed) errors.items = 'invalid';
  const items = parsed ?? [];
  const packageSlug = b.packageSlug == null || b.packageSlug === '' ? null : str(b.packageSlug);
  if (packageSlug !== null && !isPackageId(packageSlug)) errors.packageSlug = 'invalid';
  if (!errors.items && items.length === 0 && packageSlug === null) errors.items = 'required';
  if (items.length > MAX_ORDER_LINES) errors.items = 'tooLong';
  const message = str(b.message).trim();
  if (message.length > 2000) errors.message = 'tooLong';
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true,
    data: {
      items,
      packageSlug,
      requestType: b.requestType === 'personal' ? 'personal' : 'business',
      authorizationConfirmed: b.authorizationConfirmed === true,
      organisation: str(b.organisation).trim().slice(0, 120),
      phone: str(b.phone).trim().slice(0, 40),
      message,
    },
  };
}

export interface CheckoutInput {
  items: Array<{ slug: string; quantity: number }>;
}

/**
 * Day 5 — "Pay now" from the cart: product slugs + quantities ONLY. Prices, totals, currency and the user id are
 * never accepted from the browser; the server reads prices from Supabase and the user from the session cookie.
 */
export function validateCheckoutInput(body: unknown): Result<CheckoutInput, 'items'> {
  const b = (body ?? {}) as Record<string, unknown>;
  const items = parseItems(b.items);
  if (!items) return { ok: false, errors: { items: 'invalid' } };
  if (items.length === 0) return { ok: false, errors: { items: 'required' } };
  if (items.length > MAX_ORDER_LINES) return { ok: false, errors: { items: 'tooLong' } };
  return { ok: true, data: { items } };
}
