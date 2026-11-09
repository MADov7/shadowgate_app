// Account area of the navigation: signed in → the user's name (opens My Orders) + Log out;
// signed out → Log in / Sign up. Mirrors the server session (GET /api/auth/me on mount).
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogIn, LogOut, UserRound } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useSession } from '../../state/session';
import { useUI } from '../../state/ui';
import './AccountControl.css';

export function AccountControl({ variant = 'bar', onNavigate }: { variant?: 'bar' | 'menu'; onNavigate?: () => void }) {
  const { t } = useI18n();
  const status = useSession((s) => s.status);
  const user = useSession((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    void useSession.getState().refresh();
  }, []);

  const logout = async () => {
    onNavigate?.();
    const ok = await useSession.getState().logout();
    useUI.getState().toast(ok ? { tone: 'info', message: t('auth.loggedOut') } : { tone: 'warning', message: t('auth.logoutFailed') });
    if (ok) {
      if (pathname?.startsWith('/orders')) router.replace('/login');
      router.refresh();
      // The focused button disappears: move focus to the main content.
      requestAnimationFrame(() => document.getElementById('main')?.focus());
    }
  };

  if (status === 'unknown') return <span className={`sg-account sg-account--${variant} sg-account--loading`} aria-hidden="true" />;

  if (status === 'signed-in' && user) {
    return (
      <div className={`sg-account sg-account--${variant}`} role="group" aria-label={t('auth.accountLabel')}>
        <Link
          href="/orders"
          className="btn btn--secondary btn--sm sg-account__user"
          onClick={onNavigate}
          aria-label={t('auth.openOrders', { name: user.name })}
          title={t('auth.signedInAs', { name: user.name })}
          data-testid={variant === 'menu' ? 'account-name-menu' : 'account-name'}
        >
          <UserRound aria-hidden="true" />
          <span className="sg-account__name">{user.name}</span>
        </Link>
        {variant === 'menu' ? (
          <Link href="/orders" className="btn btn--ghost btn--sm" onClick={onNavigate}>
            {t('auth.myOrders')}
          </Link>
        ) : null}
        <button
          type="button"
          className={variant === 'menu' ? 'btn btn--ghost btn--sm' : 'btn btn--ghost btn--icon btn--sm'}
          onClick={logout}
          aria-label={t('auth.logout')}
          title={t('auth.logout')}
          data-testid={variant === 'menu' ? 'logout-button-menu' : 'logout-button'}
        >
          <LogOut aria-hidden="true" />
          {variant === 'menu' ? <span>{t('auth.logout')}</span> : null}
        </button>
      </div>
    );
  }

  const next = pathname && pathname !== '/login' && pathname !== '/signup' ? `?next=${encodeURIComponent(pathname)}` : '';
  return (
    <div className={`sg-account sg-account--${variant}`} role="group" aria-label={t('auth.accountLabel')}>
      <Link href={`/login${next}`} className="btn btn--ghost btn--sm" onClick={onNavigate} data-testid={variant === 'menu' ? 'login-link-menu' : 'login-link'}>
        <LogIn aria-hidden="true" />
        {t('auth.login')}
      </Link>
      <Link href="/signup" className="btn btn--secondary btn--sm" onClick={onNavigate} data-testid={variant === 'menu' ? 'signup-link-menu' : 'signup-link'}>
        {t('auth.signup')}
      </Link>
    </div>
  );
}
