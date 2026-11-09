// Persistent, lightweight navigation: floating brand + link pill + actions (language, motion, sound, basket, CTA).
// Keyboard: all links/buttons are native; the mobile menu is a disclosure that closes on Escape / link click.
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, ShoppingBag, X, Gauge } from 'lucide-react';
import { LogoLockup } from '../../brand/Logo';
import { useI18n, useLangStore, type TKey } from '../../i18n';
import { useBasketCount } from '../../state/basket';
import { useUI } from '../../state/ui';
import { useCatalog } from '../../state/catalog';
import { useExperience } from '../../state/experience';
import { scrollToId } from '../../lib/smoothScroll';
import { SECTION_IDS } from '../../lib/choreo';
import { SoundToggle } from '../../sections/Welcome/SoundToggle';
import { AccountControl } from './AccountControl';
import './Nav.css';

interface NavLink {
  id: string;
  label: TKey;
  onBefore?: () => void;
}

const LINKS: NavLink[] = [
  { id: SECTION_IDS.hero, label: 'nav.home' },
  { id: SECTION_IDS.catalog, label: 'nav.business', onBefore: () => useCatalog.getState().setAudience('business') },
  { id: SECTION_IDS.personal, label: 'nav.personal' },
  { id: SECTION_IDS.radar, label: 'nav.radar' },
  { id: SECTION_IDS.packages, label: 'nav.packages' },
  { id: SECTION_IDS.contact, label: 'nav.contact' },
];

/** Which nav link is "current" for each section on the page. */
const SECTION_TO_LINK: Record<string, string> = {
  [SECTION_IDS.hero]: SECTION_IDS.hero,
  [SECTION_IDS.radar]: SECTION_IDS.radar,
  [SECTION_IDS.layers]: SECTION_IDS.catalog,
  [SECTION_IDS.simulation]: SECTION_IDS.catalog,
  [SECTION_IDS.constellation]: SECTION_IDS.catalog,
  [SECTION_IDS.catalog]: SECTION_IDS.catalog,
  [SECTION_IDS.quiz]: SECTION_IDS.catalog,
  [SECTION_IDS.packages]: SECTION_IDS.packages,
  [SECTION_IDS.build]: SECTION_IDS.packages,
  [SECTION_IDS.personal]: SECTION_IDS.personal,
  [SECTION_IDS.contact]: SECTION_IDS.contact,
  [SECTION_IDS.brand]: SECTION_IDS.contact,
};

function useActiveSection(): string {
  const [active, setActive] = useState<string>(SECTION_IDS.hero);
  useEffect(() => {
    const ids = Object.keys(SECTION_TO_LINK);
    const els = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(SECTION_TO_LINK[entry.target.id] ?? SECTION_IDS.hero);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return active;
}

function ScrollProgress() {
  const { t } = useI18n();
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0;
      if (ref.current) ref.current.textContent = `${Math.min(100, Math.max(0, pct))}%`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <span className="sg-nav__progress telemetry" title={t('nav.progress')} aria-hidden="true">
      <span ref={ref}>0%</span>
    </span>
  );
}

export function LangToggle({ className }: { className?: string }) {
  const { t, lang } = useI18n();
  const setLang = useLangStore((s) => s.setLang);
  return (
    <button
      type="button"
      className={`btn btn--ghost btn--sm sg-lang${className ? ` ${className}` : ''}`}
      onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
      aria-label={t('common.langSwitchLabel')}
      lang={lang === 'en' ? 'ar' : 'en'}
    >
      {t('common.langSwitch')}
    </button>
  );
}

export function MotionToggle() {
  const { t } = useI18n();
  const reduced = useExperience((s) => s.reducedMotion);
  const setMotionPref = useExperience((s) => s.setMotionPref);
  return (
    <button
      type="button"
      className="btn btn--ghost btn--icon btn--sm"
      aria-pressed={reduced}
      aria-label={t('common.motionToggleLabel')}
      title={reduced ? t('common.motionReduced') : t('common.motionFull')}
      onClick={() => setMotionPref(reduced ? 'full' : 'reduced')}
    >
      <Gauge aria-hidden="true" />
    </button>
  );
}

function BasketButton() {
  const { t } = useI18n();
  const count = useBasketCount();
  const open = useUI((s) => s.openBasket);
  return (
    <button
      type="button"
      className="btn btn--secondary btn--icon sg-basket-btn"
      onClick={open}
      aria-label={t('nav.basketCount', { count })}
      data-testid="basket-button"
    >
      <ShoppingBag aria-hidden="true" />
      <span className="sg-basket-btn__badge" data-empty={count === 0} aria-hidden="true">
        {count}
      </span>
    </button>
  );
}

export function Nav() {
  const { t } = useI18n();
  const active = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const welcome = useExperience((s) => s.welcome);

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

  const go = (link: NavLink) => (event: React.MouseEvent) => {
    event.preventDefault();
    setMenuOpen(false);
    link.onBefore?.();
    scrollToId(link.id);
  };

  return (
    <header className="sg-nav" data-hidden={welcome !== 'hidden'} inert={welcome !== 'hidden' ? true : undefined}>
      <a className="sg-nav__brand" href={`#${SECTION_IDS.hero}`} onClick={go(LINKS[0])} aria-label={t('nav.homeLink')}>
        <LogoLockup />
      </a>

      <nav className="sg-nav__links" aria-label={t('nav.label')}>
        <ul>
          {LINKS.map((link) => (
            <li key={link.id}>
              <a href={`#${link.id}`} onClick={go(link)} aria-current={active === link.id ? 'true' : undefined}>
                {t(link.label)}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sg-nav__actions">
        <ScrollProgress />
        <div className="sg-nav__settings">
          <LangToggle />
          <MotionToggle />
          <SoundToggle compact />
        </div>
        <AccountControl />
        <BasketButton />
        <a
          className="btn btn--primary sg-nav__cta"
          href={`#${SECTION_IDS.contact}`}
          onClick={go({ id: SECTION_IDS.contact, label: 'nav.contact' })}
        >
          <span className="sg-nav__cta-long">{t('nav.cta')}</span>
          <span className="sg-nav__cta-short">{t('nav.ctaShort')}</span>
        </a>
        <button
          ref={menuBtn}
          type="button"
          className="btn btn--secondary btn--icon sg-nav__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="sg-mobile-menu"
          aria-label={menuOpen ? t('nav.menuClose') : t('nav.menuOpen')}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      <div id="sg-mobile-menu" className="sg-nav__mobile panel" hidden={!menuOpen}>
        <ul>
          {LINKS.map((link) => (
            <li key={link.id}>
              <a href={`#${link.id}`} onClick={go(link)} aria-current={active === link.id ? 'true' : undefined}>
                {t(link.label)}
              </a>
            </li>
          ))}
          <li>
            <Link href="/products">{t('shop.navStore')}</Link>
          </li>
          <li>
            <Link href="/cart">{t('shop.navCart')}</Link>
          </li>
        </ul>
        <AccountControl variant="menu" onNavigate={() => setMenuOpen(false)} />
        <div className="sg-nav__mobile-settings" aria-label={t('nav.settings')} role="group">
          <LangToggle />
          <MotionToggle />
          <SoundToggle />
        </div>
        <a
          className="btn btn--primary btn--block"
          href={`#${SECTION_IDS.contact}`}
          onClick={go({ id: SECTION_IDS.contact, label: 'nav.contact' })}
        >
          {t('nav.cta')}
        </a>
      </div>
    </header>
  );
}
