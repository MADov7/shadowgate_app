// /signup — create an account. The server validates again, rejects duplicate emails (409) and stores only a
// bcrypt hash of the password. On success the visitor continues to Log In (the cart stays saved).
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import type { Service } from '@/src/data/types';
import { useI18n } from '@/src/i18n';
import { useUI } from '@/src/state/ui';
import { ErrorSummary, focusControl } from '@/src/sections/Contact/FormParts';
import '@/src/sections/Contact/FormParts.css';
import { ShopShell } from '../ShopShell';
import { AuthInput, fieldMessageKey, validateClient, type AuthField, type FieldErrors } from '../authShared';

const LABELS: Record<AuthField, 'auth.nameLabel' | 'auth.emailLabel' | 'auth.passwordLabel'> = {
  name: 'auth.nameLabel',
  email: 'auth.emailLabel',
  password: 'auth.passwordLabel',
};

export default function SignupView({ next }: { products: Service[]; next: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (field: AuthField) => (value: string) => setValues((v) => ({ ...v, [field]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    const found = validateClient(values, 'signup');
    setErrors(found);
    if (Object.keys(found).length) {
      requestAnimationFrame(() => focusControl('signup-errors'));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; fields?: FieldErrors };
      if (res.status === 201) {
        useUI.getState().toast({ tone: 'success', message: t('auth.signupSuccess') });
        // Prefill the login email via sessionStorage (personal data stays out of the URL).
        try {
          sessionStorage.setItem('sg-prefill-email', values.email.trim().toLowerCase());
        } catch {
          /* storage unavailable: the visitor types it again */
        }
        const qs = new URLSearchParams({ registered: '1', next });
        router.push(`/login?${qs.toString()}`);
        return;
      }
      if (data.fields && Object.keys(data.fields).length) {
        setErrors(data.fields);
        requestAnimationFrame(() => focusControl('signup-errors'));
      } else {
        setFormError(res.status === 503 ? t('auth.errUnavailable') : t('auth.errServer'));
      }
    } catch {
      setFormError(t('auth.errNetwork'));
    } finally {
      setBusy(false);
    }
  };

  const fields = (Object.keys(errors) as AuthField[]).filter((f) => errors[f]);

  return (
    <ShopShell active="signup" title={t('auth.signupTitle')}>
      <div className="container shop-page auth-page">
        <div className="panel auth-card">
          <header className="auth-head">
            <span className="eyebrow">{t('auth.signupEyebrow')}</span>
            <h1 className="h2">{t('auth.signupTitle')}</h1>
            <p className="lead">{t('auth.signupLead')}</p>
          </header>
          <form className="auth-form" noValidate onSubmit={onSubmit} aria-busy={busy}>
            {fields.length > 0 ? (
              <ErrorSummary
                id="signup-errors"
                title={t('auth.errSummary')}
                intro=""
                items={fields.map((f) => ({ target: `signup-${f}`, label: t(LABELS[f]), message: t(fieldMessageKey(f, errors[f]!)) }))}
              />
            ) : null}
            {formError ? (
              <p className="auth-alert auth-alert--error" role="alert">
                {formError}
              </p>
            ) : null}
            <AuthInput id="signup-name" field="name" label={t('auth.nameLabel')} value={values.name} error={errors.name} autoComplete="name" onChange={set('name')} />
            <AuthInput id="signup-email" field="email" type="email" label={t('auth.emailLabel')} value={values.email} error={errors.email} autoComplete="email" onChange={set('email')} />
            <AuthInput
              id="signup-password"
              field="password"
              type="password"
              label={t('auth.passwordLabel')}
              value={values.password}
              error={errors.password}
              hint={t('auth.passwordHint')}
              autoComplete="new-password"
              onChange={set('password')}
            />
            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              <UserPlus aria-hidden="true" />
              {busy ? t('auth.signupBusy') : t('auth.signupSubmit')}
            </button>
          </form>
          <p className="auth-switch">
            {t('auth.haveAccount')}{' '}
            <Link href={`/login${next !== '/orders' ? `?next=${encodeURIComponent(next)}` : ''}`}>{t('auth.login')}</Link>
          </p>
        </div>
      </div>
    </ShopShell>
  );
}
