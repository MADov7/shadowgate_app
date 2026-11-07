// Site footer: lockup + both slogans, navigation, the classwork disclaimer, the inspiration note,
// a back-to-top control, and a giant cropped wordmark crossed by a slow beam of light (decorative).
import { ArrowUp } from 'lucide-react';
import { useI18n, translateIn, type TKey } from '../../i18n';
import { LogoLockup } from '../../brand/Logo';
import { SECTION_IDS } from '../../lib/choreo';
import { scrollToId } from '../../lib/smoothScroll';
import { useCatalog } from '../../state/catalog';
import './Footer.css';

interface FooterLink {
  id: string;
  label: TKey;
  onBefore?: () => void;
}

const PRIMARY: readonly FooterLink[] = [
  { id: SECTION_IDS.hero, label: 'nav.home' },
  { id: SECTION_IDS.catalog, label: 'nav.business', onBefore: () => useCatalog.getState().setAudience('business') },
  { id: SECTION_IDS.personal, label: 'nav.personal' },
  { id: SECTION_IDS.radar, label: 'nav.radar' },
  { id: SECTION_IDS.packages, label: 'nav.packages' },
  { id: SECTION_IDS.contact, label: 'nav.contact' },
];

const SECONDARY: readonly FooterLink[] = [
  { id: SECTION_IDS.layers, label: 'footer.linkLayers' },
  { id: SECTION_IDS.simulation, label: 'footer.linkSimulation' },
  { id: SECTION_IDS.quiz, label: 'footer.linkQuiz' },
  { id: SECTION_IDS.build, label: 'footer.linkBuild' },
  { id: SECTION_IDS.brand, label: 'footer.aboutBrand' },
];

function LinkList({ links }: { links: readonly FooterLink[] }) {
  const { t } = useI18n();
  return (
    <ul className="sg-footer__links">
      {links.map((link) => (
        <li key={link.id}>
          {/* In-page anchors are routed through scrollToId by the global handler in App. */}
          <a href={`#${link.id}`} onClick={link.onBefore}>
            {t(link.label)}
          </a>
        </li>
      ))}
    </ul>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="sg-footer" aria-label={t('footer.label')}>
      <div className="sg-footer__beam" aria-hidden="true" />
      <div className="container sg-footer__inner">
        <div className="sg-footer__grid">
          <div className="sg-footer__brand">
            <LogoLockup label={t('common.brand')} className="sg-footer__lockup" />
            <p className="sg-footer__slogan" lang="en" dir="ltr">
              {translateIn('en', 'common.slogan')}
            </p>
            <p className="sg-footer__slogan sg-footer__slogan--ar" lang="ar" dir="rtl">
              {translateIn('ar', 'common.sloganAr')}
            </p>
          </div>

          <nav className="sg-footer__nav" aria-labelledby="sg-footer-nav1">
            <p id="sg-footer-nav1" className="sg-footer__label">
              {t('footer.navTitle')}
            </p>
            <LinkList links={PRIMARY} />
          </nav>

          <nav className="sg-footer__nav" aria-labelledby="sg-footer-nav2">
            <p id="sg-footer-nav2" className="sg-footer__label">
              {t('footer.moreTitle')}
            </p>
            <LinkList links={SECONDARY} />
          </nav>

          <div className="sg-footer__disclaimer">
            <p className="sg-footer__label">{t('footer.disclaimerTitle')}</p>
            <p>{t('footer.disclaimer')}</p>
            <p className="sg-footer__inspo">{t('footer.inspiration')}</p>
          </div>
        </div>

        <div className="sg-footer__bar">
          <p className="sg-footer__copy">{t('footer.copyright')}</p>
          <span className="telemetry sg-footer__tele" aria-hidden="true">
            {t('footer.telemetry')}
          </span>
          <button type="button" className="btn btn--secondary sg-footer__top" onClick={() => scrollToId(SECTION_IDS.hero)}>
            <ArrowUp aria-hidden="true" />
            {t('footer.backToTop')}
          </button>
        </div>
      </div>
      <div className="sg-footer__word" aria-hidden="true">
        SHADOW GATE
      </div>
    </footer>
  );
}
