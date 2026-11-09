// Store navigation (Products, Product details, Cart, auth and order pages). Same look and classes as the home
// navigation, with route links instead of in-page anchors.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { LogoLockup } from '@/src/brand/Logo';
import { useI18n, type TKey } from '@/src/i18n';
import { useBasketCount } from '@/src/state/basket';
import { LangToggle } from '@/src/components/layout/Nav';
import { AccountControl } from '@/src/components/layout/AccountControl';
import { useSession } from '@/src/state/session';
import '@/src/components/layout/Nav.css';

export type ShopPage = 'home' | 'products' | 'cart' | 'orders' | 'login' | 'signup';

const LINKS: ReadonlyArray<{ id: ShopPage; href: string; label: TKey }> = [
  { id: 'home', href: '/', label: 'shop.navHome' },
  { id: 'products', href: '/products', label: 'shop.navProducts' },
  { id: 'cart', href: '/cart', label: 'shop.navCart' },
];

function CartButton() {
  const { t } = useI18n();
  const count = useBasketCount();
  return (
    <Link
      className="btn btn--secondary btn--icon sg-basket-btn"
      href="/cart"
      aria-label={t('shop.navCartCount', { count })}
      data-testid="basket-button"
    >
      <ShoppingBag aria-hidden="true" />
      <span className="sg-basket-btn__badge" data-empty={count === 0} aria-hidden="true">
        {count}
      </span>
    </Link>
  );
}

export function ShopNav({ active }: { active: ShopPage }) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const signedIn = useSession((s) => s.status === 'signed-in');

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        menuBtn.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const visible = signedIn ? [...LINKS, { id: 'orders' as const, href: '/orders', label: 'auth.myOrders' as TKey }] : LINKS;
  const links = (onClick?: () => void) =>
    visible.map((link) => (
      <li key={link.id}>
        <Link href={link.href} onClick={onClick} aria-current={active === link.id ? 'true' : undefined}>
          {t(link.label)}
        </Link>
      </li>
    ));

  return (
    <header className="sg-nav sg-nav--shop" data-hidden="false">
      <Link className="sg-nav__brand" href="/" aria-label={t('shop.brandHome')}>
        <LogoLockup />
      </Link>

      <nav className="sg-nav__links" aria-label={t('shop.navLabel')}>
        <ul>{links()}</ul>
      </nav>

      <div className="sg-nav__actions">
        <div className="sg-nav__settings">
          <LangToggle />
        </div>
        <AccountControl />
        <CartButton />
        <button
          ref={menuBtn}
          type="button"
          className="btn btn--secondary btn--icon sg-nav__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="shop-mobile-menu"
          aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <div id="shop-mobile-menu" className="sg-nav__mobile panel" hidden={!menuOpen}>
        <ul>{links(() => setMenuOpen(false))}</ul>
        <AccountControl variant="menu" onNavigate={() => setMenuOpen(false)} />
        <div className="sg-nav__mobile-settings" aria-label={t('nav.settings')} role="group">
          <LangToggle />
        </div>
      </div>
    </header>
  );
}
