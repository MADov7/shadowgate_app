// /login — the server compares the password with the bcrypt hash and sets an expiring JWT in an HttpOnly cookie.
// Clear feedback for wrong credentials (401) and for missing / expired sessions (redirected here from My Orders).
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, ShoppingBag } from 'lucide-react';
import type { Service } from '@/src/data/types';
import { useI18n } from '@/src/i18n';
import { useBasketCount } from '@/src/state/basket';
import { useSession, type SessionUser } from '@/src/state/session';
import { useUI } from '@/src/state/ui';
import { ErrorSummary, focusControl } from '@/src/sections/Contact/FormParts';
import '@/src/sections/Contact/FormParts.css';
import { ShopShell } from '../ShopShell';
import { AuthInput, fieldMessageKey, validateClient, type AuthField, type FieldErrors } from '../authShared';

export type LoginNotice = 'expired' | 'invalid' | 'required' | 'registered' | null;

interface Props {
  products: Service[];
  next: string;
  notice: LoginNotice;
  email: string;
}

export default function LoginView({ next, notice, email }: Props) {
  const { t } = useI18n();
  const router = useRouter();
  const cartCount = useBasketCount();
  const [values, setValues] = useState(() => {
    let prefill = email;
    try {
      prefill = sessionStorage.getItem('sg-prefill-email') ?? email;
      sessionStorage.removeItem('sg-prefill-email');
    } catch {
      /* storage unavailable */
    }
    return { email: prefill, password: '' };
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (field: AuthField) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const found = validateClient(values, 'login');
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => focusControl('login-errors'));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { user?: SessionUser; error?: string; fields?: FieldErrors };
      if (res.ok && data.user) {
        useSession.getState().setUser(data.user);
        useUI.getState().toast({ tone: 'success', message: t('auth.loginSuccess', { name: data.user.name }) });
        router.push(next);
        router.refresh();
        return;
      }
      if (res.status === 401) setFormError(t('auth.errInvalidCredentials'));
      else if (res.status === 429) setFormError(t('auth.errTooMany'));
      else if (data.fields && Object.keys(data.fields).length) {
        setErrors(data.fields);
        requestAnimationFrame(() => focusControl('login-errors'));
      } else setFormError(res.status === 503 ? t('auth.errUnavailable') : t('auth.errServer'));
    } catch {
      setFormError(t('auth.errNetwork'));
    } finally {
      setBusy(false);
    }
  };

  const fields = (Object.keys(errors) as AuthField[]).filter((f) => errors[f]);
  const noticeText =
    notice === 'expired'
      ? t('auth.sessionExpired')
      : notice === 'invalid'
        ? t('auth.sessionInvalid')
        : notice === 'required'
          ? t('auth.loginRequired')
          : notice === 'registered'
            ? t('auth.signupSuccess')
            : null;

  return (
    <ShopShell active="login" title={t('auth.loginTitle')}>
      <div className="container shop-page auth-page">
        <div className="panel auth-card">
          <header className="auth-head">
            <span className="eyebrow">{t('auth.loginEyebrow')}</span>
            <h1 className="h2">{t('auth.loginTitle')}</h1>
            <p className="lead">{t('auth.loginLead')}</p>
          </header>
          {noticeText ? (
            <p className={`auth-alert ${notice === 'registered' ? 'auth-alert--ok' : 'auth-alert--warn'}`} role="status" data-testid="login-notice">
              {noticeText}
            </p>
          ) : null}
          {cartCount > 0 ? (
            <p className="auth-cart">
              <ShoppingBag aria-hidden="true" />
              {t('shop.cartSaved')}
            </p>
          ) : null}
          <form className="auth-form" noValidate onSubmit={onSubmit} aria-busy={busy}>
            {fields.length > 0 ? (
              <ErrorSummary
                id="login-errors"
                title={t('auth.errSummary')}
                intro=""
                items={fields.map((f) => ({
                  target: `login-${f}`,
                  label: t(f === 'email' ? 'auth.emailLabel' : 'auth.passwordLabel'),
                  message: t(fieldMessageKey(f, errors[f]!)),
                }))}
              />
            ) : null}
            {formError ? (
              <p className="auth-alert auth-alert--error" role="alert" data-testid="login-error">
                {formError}
              </p>
            ) : null}
            <AuthInput id="login-email" field="email" type="email" label={t('auth.emailLabel')} value={values.email} error={errors.email} autoComplete="email" onChange={set('email')} />
            <AuthInput
              id="login-password"
              field="password"
              type="password"
              label={t('auth.passwordLabel')}
              value={values.password}
              error={errors.password}
              autoComplete="current-password"
              onChange={set('password')}
            />
            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              <LogIn aria-hidden="true" />
              {busy ? t('auth.loginBusy') : t('auth.loginSubmit')}
            </button>
          </form>
          <p className="auth-switch">
            {t('auth.noAccount')}{' '}
            <Link href={`/signup${next !== '/orders' ? `?next=${encodeURIComponent(next)}` : ''}`}>{t('auth.signup')}</Link>
          </p>
        </div>
      </div>
    </ShopShell>
  );
}
