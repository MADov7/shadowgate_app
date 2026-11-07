import { describe, expect, it } from 'vitest';
import {
  EMPTY_REQUEST_FORM,
  LIMITS,
  errorFields,
  hasErrors,
  isValidEmail,
  isValidPhone,
  normalizeDigits,
  validateBookingForm,
  validateRequestForm,
  type BookingFormValues,
  type RequestFormValues,
} from './validation';

const validRequest: RequestFormValues = {
  ...EMPTY_REQUEST_FORM,
  fullName: 'Layla Haddad',
  email: 'layla@example.com',
  customerType: 'business',
  message: 'We would like a review of our online store.',
  acknowledge: true,
};

describe('isValidEmail', () => {
  it.each([
    'name@example.com',
    'first.last@example.co.uk',
    'user+tag@sub.domain.org',
    "o'brien@example.ie",
    '  padded@example.com  ',
    'x@example.museum',
    'name@xn--mgbh0fb.xn--kgbechtv',
    'user@مثال.اختبار',
  ])('accepts %s', (email) => {
    expect(isValidEmail(email)).toBe(true);
  });

  it.each([
    '',
    '   ',
    'plainaddress',
    '@example.com',
    'name@',
    'name@example',
    'name@@example.com',
    'na@me@example.com',
    'name@example..com',
    'name@.example.com',
    'name@example.com.',
    '.name@example.com',
    'name.@example.com',
    'na..me@example.com',
    'name @example.com',
    'name@exa mple.com',
    'name@-example.com',
    'name@example-.com',
    'name@example.c',
    'name@example.123',
    'name@exam_ple.com',
    `${'a'.repeat(65)}@example.com`,
    `name@${'a'.repeat(64)}.com`,
    `${'a'.repeat(60)}@${'b'.repeat(63)}.${'c'.repeat(63)}.${'d'.repeat(63)}.com`, // 256 chars > 254
  ])('rejects %s', (email) => {
    expect(isValidEmail(email)).toBe(false);
  });
});

describe('isValidPhone', () => {
  it.each(['+965 2222 3333', '(02) 9876-5432', '0501234567', '+1.415.555.0100', '+٩٦٥ ٢٢٢٢ ٣٣٣٣'])('accepts %s', (p) => {
    expect(isValidPhone(p)).toBe(true);
  });
  it.each(['', '12345', '+12 34', 'phone me', '555-CALL-NOW', '1234567890123456', '12+34567890', '++96522223333'])(
    'rejects %s',
    (p) => {
      expect(isValidPhone(p)).toBe(false);
    },
  );
  it('normalizes Arabic-Indic digits', () => {
    expect(normalizeDigits('٠١٢٣٤٥٦٧٨٩ ۰۱۲')).toBe('0123456789 012');
  });
});

describe('validateRequestForm', () => {
  it('passes a complete request', () => {
    expect(validateRequestForm(validRequest, { requiresAuthorization: false })).toEqual({});
  });

  it('flags every required field on an empty form, in form order', () => {
    const errors = validateRequestForm(EMPTY_REQUEST_FORM, { requiresAuthorization: false });
    expect(errorFields(errors)).toEqual(['fullName', 'email', 'customerType', 'message', 'acknowledge']);
    expect(errors.fullName?.code).toBe('required');
    expect(errors.email?.code).toBe('required');
    expect(errors.customerType?.code).toBe('choice');
    expect(errors.message?.code).toBe('required');
    expect(errors.acknowledge?.code).toBe('acknowledge');
  });

  it('treats whitespace-only values as empty', () => {
    const errors = validateRequestForm({ ...validRequest, fullName: '   ', message: '\n\t ' }, { requiresAuthorization: false });
    expect(errors.fullName?.code).toBe('required');
    expect(errors.message?.code).toBe('required');
  });

  it('enforces name and message lengths', () => {
    const errors = validateRequestForm(
      { ...validRequest, fullName: 'L', message: 'Too short' },
      { requiresAuthorization: false },
    );
    expect(errors.fullName).toEqual({ code: 'tooShort', limit: LIMITS.nameMin });
    expect(errors.message).toEqual({ code: 'tooShort', limit: LIMITS.messageMin });
    // exactly the minimum is fine (trimmed)
    const ok = validateRequestForm({ ...validRequest, message: '  1234567890  ' }, { requiresAuthorization: false });
    expect(ok.message).toBeUndefined();
    const long = validateRequestForm(
      { ...validRequest, message: 'x'.repeat(LIMITS.messageMax + 1) },
      { requiresAuthorization: false },
    );
    expect(long.message).toEqual({ code: 'tooLong', limit: LIMITS.messageMax });
  });

  it('validates email format', () => {
    const errors = validateRequestForm({ ...validRequest, email: 'layla@example' }, { requiresAuthorization: false });
    expect(errors.email?.code).toBe('email');
  });

  it('keeps phone optional but validates it when given', () => {
    expect(validateRequestForm({ ...validRequest, phone: '' }, { requiresAuthorization: false }).phone).toBeUndefined();
    expect(validateRequestForm({ ...validRequest, phone: '12ab' }, { requiresAuthorization: false }).phone?.code).toBe(
      'phone',
    );
    expect(
      validateRequestForm({ ...validRequest, phone: '+965 2222 3333' }, { requiresAuthorization: false }).phone,
    ).toBeUndefined();
  });

  it('requires a phone number when phone is the preferred contact method', () => {
    const errors = validateRequestForm({ ...validRequest, contactMethod: 'phone' }, { requiresAuthorization: false });
    expect(errors.phone?.code).toBe('phoneRequired');
    const ok = validateRequestForm(
      { ...validRequest, contactMethod: 'phone', phone: '+965 2222 3333' },
      { requiresAuthorization: false },
    );
    expect(hasErrors(ok)).toBe(false);
  });

  it('requires the authorization confirmation only when pen-testing is requested', () => {
    expect(validateRequestForm(validRequest, { requiresAuthorization: false }).authorization).toBeUndefined();
    expect(validateRequestForm(validRequest, { requiresAuthorization: true }).authorization?.code).toBe('authorization');
    expect(
      validateRequestForm({ ...validRequest, authorization: true }, { requiresAuthorization: true }),
    ).toEqual({});
  });

  it('limits the optional organisation field', () => {
    const errors = validateRequestForm(
      { ...validRequest, organisation: 'o'.repeat(LIMITS.orgMax + 1) },
      { requiresAuthorization: false },
    );
    expect(errors.organisation?.code).toBe('tooLong');
  });

  it('rejects an unknown customer type', () => {
    const tampered = { ...validRequest, customerType: 'robot' } as unknown as RequestFormValues;
    expect(validateRequestForm(tampered, { requiresAuthorization: false }).customerType?.code).toBe('choice');
  });
});

describe('validateBookingForm', () => {
  const ctx = { serviceIds: ['personal-accounts', 'device-review'], dates: ['2026-11-03', '2026-11-04'], times: ['09:00', '10:30'] };
  const valid: BookingFormValues = {
    serviceId: 'personal-accounts',
    date: '2026-11-03',
    time: '10:30',
    format: 'online',
    name: 'Omar',
    email: 'omar@example.com',
    notes: '',
  };

  it('passes a complete booking', () => {
    expect(validateBookingForm(valid, ctx)).toEqual({});
  });

  it('flags empty choices and fields in order', () => {
    const errors = validateBookingForm({ serviceId: '', date: '', time: '', format: '', name: '', email: '', notes: '' }, ctx);
    expect(errorFields(errors)).toEqual(['serviceId', 'date', 'time', 'format', 'name', 'email']);
  });

  it('rejects options that were not offered', () => {
    const errors = validateBookingForm({ ...valid, serviceId: 'pen-testing', date: '2026-11-07', time: '23:00' }, ctx);
    expect(errors.serviceId?.code).toBe('choice');
    expect(errors.date?.code).toBe('choice');
    expect(errors.time?.code).toBe('choice');
  });

  it('validates email and notes length', () => {
    const errors = validateBookingForm({ ...valid, email: 'omar@', notes: 'n'.repeat(LIMITS.notesMax + 1) }, ctx);
    expect(errors.email?.code).toBe('email');
    expect(errors.notes?.code).toBe('tooLong');
  });
});
