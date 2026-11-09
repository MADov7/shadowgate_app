// Shared pieces for the Sign Up / Log In forms: field markup (site form styles), error-code → message mapping,
// client-side validation (same rules as the server) and a safe "next" redirect.
import { useState, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { TKey } from '@/src/i18n';
import { useI18n } from '@/src/i18n';
import { isValidEmail } from '@/src/lib/validation';
import { FieldErrorText, describedBy } from '@/src/sections/Contact/FormParts';

export type AuthField = 'name' | 'email' | 'password';
export type FieldCode = 'required' | 'invalid' | 'tooShort' | 'tooLong' | 'taken';
export type FieldErrors = Partial<Record<AuthField, FieldCode>>;

export function fieldMessageKey(field: AuthField, code: FieldCode): TKey {
  if (code === 'required') return 'auth.errRequired';
  if (code === 'taken') return 'auth.errTaken';
  if (field === 'email') return 'auth.errEmail';
  if (field === 'password') return code === 'tooShort' ? 'auth.errPasswordShort' : 'auth.errPasswordLong';
  return 'auth.errNameLong';
}

/** Browser-side checks mirroring lib/validators.ts (the server checks again). */
export function validateClient(values: Partial<Record<AuthField, string>>, mode: 'signup' | 'login'): FieldErrors {
  const errors: FieldErrors = {};
  if (mode === 'signup') {
    const name = (values.name ?? '').trim();
    if (!name) errors.name = 'required';
    else if (name.length > 80) errors.name = 'tooLong';
  }
  const email = (values.email ?? '').trim();
  if (!email) errors.email = 'required';
  else if (!isValidEmail(email)) errors.email = 'invalid';
  const password = values.password ?? '';
  if (!password) errors.password = 'required';
  else if (mode === 'signup' && password.length < 8) errors.password = 'tooShort';
  else if (mode === 'signup' && new TextEncoder().encode(password).length > 72) errors.password = 'tooLong';
  return errors;
}

export { safeNext } from '@/lib/safeNext';

interface FieldProps {
  id: string;
  field: AuthField;
  label: string;
  value: string;
  error?: FieldCode;
  hint?: string;
  type?: 'text' | 'email' | 'password';
  autoComplete: string;
  onChange: (value: string) => void;
  children?: ReactNode;
}

export function AuthInput({ id, field, label, value, error, hint, type = 'text', autoComplete, onChange }: FieldProps) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        <span className="field__req" aria-hidden="true">
          *
        </span>
      </label>
      <div className={isPassword ? 'auth-pass' : undefined} dir={isPassword ? 'ltr' : undefined}>
        <input
          id={id}
          className="input"
          name={field}
          type={isPassword && show ? 'text' : type}
          inputMode={type === 'email' ? 'email' : undefined}
          dir={type === 'email' || isPassword ? 'ltr' : undefined}
          autoComplete={autoComplete}
          required
          aria-required="true"
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(hintId, errorId)}
          onChange={(e) => onChange(e.target.value)}
        />
        {isPassword ? (
          <button
            type="button"
            className="btn btn--ghost btn--icon btn--sm auth-pass__toggle"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? t('auth.hidePassword') : t('auth.showPassword')}
          >
            {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </button>
        ) : null}
      </div>
      {hint ? (
        <p id={hintId} className="field__hint">
          {hint}
        </p>
      ) : null}
      {error ? <FieldErrorText id={`${id}-error`}>{t(fieldMessageKey(field, error))}</FieldErrorText> : null}
    </div>
  );
}
