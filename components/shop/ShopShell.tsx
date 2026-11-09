// Shared frame for every store page: Shadow Gate's calm static backdrop, the store navigation, a footer, and the
// overlays the reused components rely on (details dialog, demo booking dialog, toasts).
import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import '@/src/boot';
import '@/src/App.css';
import { useI18n } from '@/src/i18n';
import { LogoLockup } from '@/src/brand/Logo';
import { Toaster } from '@/src/components/ui/Toaster';
import { ServiceDetailsDialog } from '@/src/overlays/ServiceDetailsDialog';
import { BookingDialog } from '@/src/overlays/BookingDialog';
import { ShopNav, type ShopPage } from './ShopNav';
import './shop.css';

function ShopFooter() {
  const { t } = useI18n();
  return (
    <footer className="shop-footer">
      <div className="container shop-footer__inner">
        <Link href="/" className="shop-footer__brand" aria-label={t('shop.brandHome')}>
          <LogoLockup />
        </Link>
        <nav aria-label={t('shop.navLabel')}>
          <ul className="shop-footer__links">
            <li>
              <Link href="/">{t('shop.navHome')}</Link>
            </li>
            <li>
              <Link href="/products">{t('shop.navProducts')}</Link>
            </li>
            <li>
              <Link href="/cart">{t('shop.navCart')}</Link>
            </li>
          </ul>
        </nav>
        <p className="shop-footer__note">{t('shop.footerNote')}</p>
      </div>
    </footer>
  );
}

export function ShopShell({ active, title, children }: { active: ShopPage; title?: string; children: ReactNode }) {
  const { t, lang } = useI18n();
  // Translated page title (the language switch would otherwise reset it to the generic site title).
  useEffect(() => {
    if (title) document.title = `${title} — SHADOW GATE`;
  }, [title, lang]);
  return (
    <>
      <a className="skip-link" href="#main">
        {t('common.skipToContent')}
      </a>
      <div className="sg-static-bg" aria-hidden="true" />
      <div className="sg-atmo" aria-hidden="true" />
      <ShopNav active={active} />
      <main id="main" className="shop-main" tabIndex={-1}>
        {children}
      </main>
      <ShopFooter />
      <ServiceDetailsDialog />
      <BookingDialog />
      <Toaster />
    </>
  );
}
