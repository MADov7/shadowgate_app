// About the Brand (#about-brand) — concise identity overview for assignment review:
// concept & audience, value proposition, personality, logo, palette (computed contrast), type, style, slogans
// and the customer journey mapped to the sections of this page.
import { ArrowUpRight, Crosshair, Eye, HandHeart } from 'lucide-react';
import { useI18n, translateIn, type TKey } from '../../i18n';
import { LogoLockup, LogoMark } from '../../brand/Logo';
import { COLORS } from '../../brand/brand';
import { SECTION_IDS } from '../../lib/choreo';
import { contrastRatio, contrastRating, type ContrastRating } from './contrast';
import './BrandAbout.css';

const TRAITS: ReadonlyArray<{ icon: typeof Eye; name: TKey; line: TKey }> = [
  { icon: Eye, name: 'brand.vigilant', line: 'brand.vigilantLine' },
  { icon: Crosshair, name: 'brand.precise', line: 'brand.preciseLine' },
  { icon: HandHeart, name: 'brand.approachable', line: 'brand.approachableLine' },
];

const SWATCHES: ReadonlyArray<{ hex: string; name: TKey; role: TKey; base?: boolean }> = [
  { hex: COLORS.navy, name: 'brand.navyName', role: 'brand.navyRole', base: true },
  { hex: COLORS.teal, name: 'brand.tealName', role: 'brand.tealRole' },
  { hex: COLORS.white, name: 'brand.whiteName', role: 'brand.whiteRole' },
  { hex: COLORS.muted, name: 'brand.mutedName', role: 'brand.mutedRole' },
  { hex: COLORS.threat, name: 'brand.redName', role: 'brand.redRole' },
];

const RATING_KEY: Record<ContrastRating, TKey> = {
  AAA: 'brand.ratingAAA',
  AA: 'brand.ratingAA',
  large: 'brand.ratingLarge',
  fail: 'brand.ratingLarge',
};

const STYLE_KEYS: readonly TKey[] = [
  'brand.style1',
  'brand.style2',
  'brand.style3',
  'brand.style4',
  'brand.style5',
  'brand.style6',
  'brand.style7',
];

const JOURNEY: ReadonlyArray<{ title: TKey; body: TKey; link: TKey; target: string }> = [
  { title: 'brand.j1', body: 'brand.j1Body', link: 'brand.j1Link', target: SECTION_IDS.hero },
  { title: 'brand.j2', body: 'brand.j2Body', link: 'brand.j2Link', target: SECTION_IDS.radar },
  { title: 'brand.j3', body: 'brand.j3Body', link: 'brand.j3Link', target: SECTION_IDS.catalog },
  { title: 'brand.j4', body: 'brand.j4Body', link: 'brand.j4Link', target: SECTION_IDS.build },
  { title: 'brand.j5', body: 'brand.j5Body', link: 'brand.j5Link', target: SECTION_IDS.contact },
];

export function BrandAbout() {
  const { t } = useI18n();

  return (
    <section id={SECTION_IDS.brand} className="section brand" aria-labelledby="about-brand-title">
      <div className="container">
        <header className="section-head">
          <p className="eyebrow">{t('brand.eyebrow')}</p>
          <h2 id="about-brand-title" className="h2">
            {t('brand.title')}
          </h2>
          <p className="lead">{t('brand.lead')}</p>
        </header>

        {/* Concept · value · personality */}
        <div className="brand__overview">
          <article className="card brand-card">
            <span className="telemetry" aria-hidden="true">
              01
            </span>
            <h3 className="brand-card__title">{t('brand.conceptTitle')}</h3>
            <p className="brand-card__body">{t('brand.conceptBody')}</p>
          </article>
          <article className="card brand-card">
            <span className="telemetry" aria-hidden="true">
              02
            </span>
            <h3 className="brand-card__title">{t('brand.valueTitle')}</h3>
            <p className="brand-card__body">{t('brand.valueBody')}</p>
          </article>
          <article className="card brand-card brand-card--traits">
            <span className="telemetry" aria-hidden="true">
              03
            </span>
            <h3 className="brand-card__title">{t('brand.personalityTitle')}</h3>
            <ul className="brand-traits">
              {TRAITS.map(({ icon: Icon, name, line }) => (
                <li key={name}>
                  <Icon aria-hidden="true" />
                  <p>
                    <strong>{t(name)}</strong> {t(line)}
                  </p>
                </li>
              ))}
            </ul>
          </article>
        </div>

        {/* Visual identity */}
        <h3 className="brand__subhead">{t('brand.identityTitle')}</h3>
        <div className="brand__identity">
          <article className="panel brand-logo">
            <h4 className="brand-block__title">{t('brand.logoTitle')}</h4>
            <div className="brand-logo__stage grid-bg">
              <LogoMark className="brand-logo__mark" title={t('brand.logoMark')} />
            </div>
            <p className="brand-block__body">{t('brand.logoBody')}</p>
            <div className="brand-logo__row">
              <figure className="brand-logo__lockup">
                <LogoLockup label={t('common.brand')} />
                <figcaption className="telemetry">{t('brand.logoLockup')}</figcaption>
              </figure>
              <figure className="brand-logo__favicons">
                <div className="brand-logo__favs">
                  {[16, 32, 64].map((size) => (
                    <div key={size} className="brand-fav">
                      <span className="brand-fav__tile">
                        <img src="/favicon.svg" width={size} height={size} alt="" />
                      </span>
                      <span className="brand-fav__size">{t('brand.faviconSize', { size })}</span>
                    </div>
                  ))}
                </div>
                <figcaption className="telemetry">{t('brand.logoFavicon')}</figcaption>
              </figure>
            </div>
          </article>

          <article className="panel brand-palette">
            <h4 className="brand-block__title">{t('brand.paletteTitle')}</h4>
            <ul className="brand-swatches">
              {SWATCHES.map(({ hex, name, role, base }) => {
                const ratio = contrastRatio(hex, COLORS.navy);
                return (
                  <li key={hex} className="brand-swatch">
                    <span className="brand-swatch__chip" style={{ background: hex }} data-base={base || undefined} />
                    <div className="brand-swatch__text">
                      <p className="brand-swatch__name">
                        {t(name)} <code>{hex}</code>
                      </p>
                      <p className="brand-swatch__role">{t(role)}</p>
                    </div>
                    <p className="brand-swatch__contrast">
                      {base ? (
                        t('brand.contrastBase')
                      ) : (
                        <>
                          <span className="brand-swatch__ratio">{t('brand.contrast', { ratio: ratio.toFixed(1) })}</span>
                          <span className="badge badge--teal">{t(RATING_KEY[contrastRating(ratio)])}</span>
                        </>
                      )}
                    </p>
                  </li>
                );
              })}
            </ul>
          </article>
        </div>

        {/* Typography */}
        <h3 className="brand__subhead">{t('brand.typeTitle')}</h3>
        <div className="brand__type">
          <figure className="brand-spec brand-spec--en">
            <span className="brand-spec__aa" aria-hidden="true">
              Aa
            </span>
            <p className="brand-spec__sample" lang="en" dir="ltr">
              {translateIn('en', 'brand.specimenEn')}
            </p>
            <figcaption>
              <strong>Manrope</strong> · {t('brand.typeManrope')}
              <span className="telemetry">400 · 600 · 800</span>
            </figcaption>
          </figure>
          <figure className="brand-spec brand-spec--ar">
            <span className="brand-spec__aa" aria-hidden="true">
              أب
            </span>
            <p className="brand-spec__sample" lang="ar" dir="rtl">
              {translateIn('ar', 'common.sloganAr')}
            </p>
            <figcaption>
              <strong>Tajawal</strong> · {t('brand.typeTajawal')}
              <span className="telemetry">400 · 500 · 700 · 800</span>
            </figcaption>
          </figure>
          <figure className="brand-spec brand-spec--mono">
            <span className="brand-spec__aa" aria-hidden="true">
              {'{ }'}
            </span>
            <p className="brand-spec__sample" lang="en" dir="ltr">
              {t('brand.specimenMono')}
            </p>
            <figcaption>
              <strong>JetBrains Mono</strong> · {t('brand.typeMono')}
              <span className="telemetry">400 · 500</span>
            </figcaption>
          </figure>
        </div>

        {/* Style + slogans */}
        <div className="brand__duo">
          <div>
            <h3 className="brand__subhead">{t('brand.styleTitle')}</h3>
            <ul className="brand-keywords">
              {STYLE_KEYS.map((key) => (
                <li key={key} className="chip">
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="brand__subhead">{t('brand.slogansTitle')}</h3>
            <div className="brand-slogans">
              <figure className="brand-slogan">
                <figcaption className="telemetry">{t('brand.sloganEnLabel')}</figcaption>
                <blockquote lang="en" dir="ltr">{translateIn('en', 'common.slogan')}</blockquote>
              </figure>
              <figure className="brand-slogan brand-slogan--ar">
                <figcaption className="telemetry">{t('brand.sloganArLabel')}</figcaption>
                <blockquote lang="ar" dir="rtl">{translateIn('ar', 'common.sloganAr')}</blockquote>
              </figure>
            </div>
          </div>
        </div>

        {/* Customer journey */}
        <h3 className="brand__subhead">{t('brand.journeyTitle')}</h3>
        <p className="brand__journey-lead">{t('brand.journeyLead')}</p>
        <ol className="brand-journey">
          {JOURNEY.map(({ title, body, link, target }, i) => (
            <li key={title} className="brand-step">
              <span className="brand-step__num" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="sr-only">{t('brand.journeyStep', { index: i + 1 })}</p>
              <p className="brand-step__title">{t(title)}</p>
              <p className="brand-step__body">{t(body)}</p>
              <a className="brand-step__link" href={`#${target}`} aria-label={t('brand.goTo', { section: t(link) })}>
                {t(link)}
                <ArrowUpRight aria-hidden="true" className="icon-flip" />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
