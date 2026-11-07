// Pure form validation for the demo request form (#contact) and the demo booking dialog.
// No DOM, no i18n: every rule returns an error *code* that the UI turns into a localized message.
// Error objects keep the field order of the form, so the error summary lists problems top-to-bottom.

export type ErrorCode =
  | 'required'
  | 'tooShort'
  | 'tooLong'
  | 'email'
  | 'phone'
  | 'phoneRequired'
  | 'choice'
  | 'authorization'
  | 'acknowledge';

export interface FieldError {
  code: ErrorCode;
  /** Limit that was broken (for tooShort / tooLong messages). */
  limit?: number;
}

export type Errors<K extends string> = Partial<Record<K, FieldError>>;

export const LIMITS = {
  nameMin: 2,
  nameMax: 100,
  emailMax: 254,
  orgMax: 120,
  messageMin: 10,
  messageMax: 2000,
  notesMax: 1000,
  phoneDigitsMin: 7,
  phoneDigitsMax: 15,
} as const;

/** Arabic-Indic (٠-٩) and Eastern Arabic-Indic (۰-۹) digits → Latin, so Arabic keyboards validate the same. */
export function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (d) => {
    const code = d.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

const LOCAL_PART = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+$/;
const DOMAIN_LABEL = /^[\p{L}\p{N}-]+$/u;
const TLD = /^(?:\p{L}{2,63}|xn--[a-z0-9-]{2,59})$/iu;

/**
 * Practical email check (not full RFC 5322): one "@", a sane local part, a dotted domain whose labels
 * are 1–63 chars without leading/trailing hyphens, and an alphabetic (or punycode) top-level domain.
 */
export function isValidEmail(raw: string): boolean {
  const value = raw.trim();
  if (value.length === 0 || value.length > LIMITS.emailMax) return false;
  if (/\s/.test(value)) return false;
  const at = value.indexOf('@');
  if (at <= 0 || at !== value.lastIndexOf('@')) return false;
  const local = value.slice(0, at);
  const domain = value.slice(at + 1);
  if (local.length > 64 || !LOCAL_PART.test(local)) return false;
  if (local.startsWith('.') || local.endsWith('.') || local.includes('..')) return false;
  const labels = domain.split('.');
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (label.length === 0 || label.length > 63) return false;
    if (!DOMAIN_LABEL.test(label) || label.startsWith('-') || label.endsWith('-')) return false;
  }
  return TLD.test(labels[labels.length - 1]);
}

/** Light phone check: optional leading "+", then digits with spaces, dots, dashes or brackets; 7–15 digits. */
export function isValidPhone(raw: string): boolean {
  const value = normalizeDigits(raw.trim());
  if (!value) return false;
  if (!/^\+?[0-9\s().-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, '').length;
  return digits >= LIMITS.phoneDigitsMin && digits <= LIMITS.phoneDigitsMax;
}

function textRule(value: string, { required = false, min = 0, max = Infinity } = {}): FieldError | undefined {
  const v = value.trim();
  if (!v) return required ? { code: 'required' } : undefined;
  if (v.length < min) return { code: 'tooShort', limit: min };
  if (v.length > max) return { code: 'tooLong', limit: max };
  return undefined;
}

function emailRule(value: string): FieldError | undefined {
  if (!value.trim()) return { code: 'required' };
  return isValidEmail(value) ? undefined : { code: 'email' };
}

function compact<K extends string>(entries: Array<[K, FieldError | undefined]>): Errors<K> {
  const out: Errors<K> = {};
  for (const [key, error] of entries) if (error) out[key] = error;
  return out;
}

export function hasErrors(errors: Errors<string>): boolean {
  return Object.keys(errors).length > 0;
}

/** Field keys with errors, in form order. */
export function errorFields<K extends string>(errors: Errors<K>): K[] {
  return Object.keys(errors) as K[];
}

// ---------------------------------------------------------------------------------------------
// Request form (#contact)
// ---------------------------------------------------------------------------------------------
export type CustomerType = 'business' | 'individual';
export type ContactMethod = 'email' | 'phone';

export interface RequestFormValues {
  fullName: string;
  email: string;
  organisation: string;
  customerType: CustomerType | '';
  phone: string;
  contactMethod: ContactMethod;
  message: string;
  /** Ownership / written-authorization confirmation — only required when pen-testing is requested. */
  authorization: boolean;
  /** "I understand this classwork demo only saves my request in this browser." */
  acknowledge: boolean;
}

export type RequestField = keyof RequestFormValues;

export const EMPTY_REQUEST_FORM: RequestFormValues = {
  fullName: '',
  email: '',
  organisation: '',
  customerType: '',
  phone: '',
  contactMethod: 'email',
  message: '',
  authorization: false,
  acknowledge: false,
};

export interface RequestFormContext {
  /** True when the request contains a service that requires ownership or explicit written authorization. */
  requiresAuthorization: boolean;
}

export function validateRequestForm(values: RequestFormValues, ctx: RequestFormContext): Errors<RequestField> {
  const phone = values.phone.trim();
  let phoneError: FieldError | undefined;
  if (phone) phoneError = isValidPhone(phone) ? undefined : { code: 'phone' };
  else if (values.contactMethod === 'phone') phoneError = { code: 'phoneRequired' };

  return compact<RequestField>([
    ['fullName', textRule(values.fullName, { required: true, min: LIMITS.nameMin, max: LIMITS.nameMax })],
    ['email', emailRule(values.email)],
    ['organisation', textRule(values.organisation, { max: LIMITS.orgMax })],
    [
      'customerType',
      values.customerType === 'business' || values.customerType === 'individual' ? undefined : { code: 'choice' },
    ],
    ['phone', phoneError],
    ['contactMethod', values.contactMethod === 'email' || values.contactMethod === 'phone' ? undefined : { code: 'choice' }],
    ['message', textRule(values.message, { required: true, min: LIMITS.messageMin, max: LIMITS.messageMax })],
    ['authorization', ctx.requiresAuthorization && !values.authorization ? { code: 'authorization' } : undefined],
    ['acknowledge', values.acknowledge ? undefined : { code: 'acknowledge' }],
  ]);
}

// ---------------------------------------------------------------------------------------------
// Demo booking dialog
// ---------------------------------------------------------------------------------------------
export type SessionFormat = 'online' | 'in-person';

export interface BookingFormValues {
  serviceId: string;
  /** Local ISO date, YYYY-MM-DD (one of the offered weekdays). */
  date: string;
  /** HH:MM (one of the offered slots). */
  time: string;
  format: SessionFormat | '';
  name: string;
  email: string;
  notes: string;
}

export type BookingField = keyof BookingFormValues;

export interface BookingFormContext {
  serviceIds: readonly string[];
  dates: readonly string[];
  times: readonly string[];
}

function oneOf(value: string, options: readonly string[]): FieldError | undefined {
  return value && options.includes(value) ? undefined : { code: 'choice' };
}

export function validateBookingForm(values: BookingFormValues, ctx: BookingFormContext): Errors<BookingField> {
  return compact<BookingField>([
    ['serviceId', oneOf(values.serviceId, ctx.serviceIds)],
    ['date', oneOf(values.date, ctx.dates)],
    ['time', oneOf(values.time, ctx.times)],
    ['format', values.format === 'online' || values.format === 'in-person' ? undefined : { code: 'choice' }],
    ['name', textRule(values.name, { required: true, min: LIMITS.nameMin, max: LIMITS.nameMax })],
    ['email', emailRule(values.email)],
    ['notes', textRule(values.notes, { max: LIMITS.notesMax })],
  ]);
}
