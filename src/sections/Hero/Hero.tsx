// Scene A — hero. Continues the world from the entrance: world-core renders the 3D data core on the end
// side; the copy sits on the start side over a readability scrim, with HUD telemetry floating around the core.
//
// Choreography
//   • Reveal: staggered line reveal, cued by the welcome entrance as the camera arrives (or on load when
//     the welcome was skipped). Instant under reduced motion.
//   • Scroll-out (cinematic only): one scrubbed GSAP timeline — the headline lags, scales and fades, values
//     and telemetry drift at different depths, the reticle grows past the camera. Fully reversible.
//   • Static mode: no scrub; a static SVG art panel replaces the 3D core.
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Compass, ListChecks, MousePointerClick, ShieldCheck } from 'lucide-react';
import { translateIn, useI18n, type TKey } from '../../i18n';
import { useExperience } from '../../state/experience';
import { useCatalog } from '../../state/catalog';
import { gsap, scrollToId } from '../../lib/smoothScroll';
import { SECTION_IDS } from '../../lib/choreo';
import { onHeroCue } from '../Welcome/entrance';
import { HeroStaticArt } from './HeroStaticArt';
import { HERO_CORE_MIRRORS_IN_RTL, heroCoreFrame, hudLayout, type HudLayout } from './coreFrame';
import './Hero.css';

const VALUES: ReadonlyArray<{ icon: typeof ListChecks; title: TKey; text: TKey }> = [
  { icon: ListChecks, title: 'hero.value1Title', text: 'hero.value1Text' },
  { icon: Compass, title: 'hero.value2Title', text: 'hero.value2Text' },
  { icon: MousePointerClick, title: 'hero.value3Title', text: 'hero.value3Text' },
];

const TELEMETRY: ReadonlyArray<{ key: TKey; pos: string; live?: boolean }> = [
  { key: 'hero.teleCore', pos: 'core', live: true },
  { key: 'hero.teleLayers', pos: 'layers' },
  { key: 'hero.teleScene', pos: 'scene' },
  { key: 'hero.teleSurfaces', pos: 'surfaces' },
];

export function Hero() {
  const { t, isAr } = useI18n();
  const mode = useExperience((s) => s.mode);
  const rootRef = useRef<HTMLElement>(null);
  const revealTl = useRef<gsap.core.Timeline | null>(null);
  const revealed = useRef(false);
  const cinematic = mode === 'cinematic';
  const [hud, setHud] = useState<HudLayout>({ mode: 'orbit', side: 'right' });

  // Frame the real on-screen core: project it for this viewport and expose it to the HUD CSS.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !cinematic) return;
    const apply = () => {
      const w = document.documentElement.clientWidth;
      const h = window.innerHeight;
      const f = heroCoreFrame(w, h, HERO_CORE_MIRRORS_IN_RTL && isAr);
      root.style.setProperty('--core-x', `${f.x.toFixed(1)}px`);
      root.style.setProperty('--core-y', `${f.y.toFixed(1)}px`);
      root.style.setProperty('--core-d', `${f.d.toFixed(1)}px`);
      const next = hudLayout(f, w, isAr ? 'right' : 'left');
      setHud((prev) => (prev.mode === next.mode && prev.side === next.side ? prev : next));
    };
    apply();
    window.addEventListener('resize', apply);
    return () => window.removeEventListener('resize', apply);
  }, [cinematic, isAr]);

  // Build the reveal (paused) before first paint so nothing flashes before the cue.
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || revealed.current || useExperience.getState().reducedMotion) return;
    const ctx = gsap.context(() => {
      const q = (sel: string) => Array.from(root.querySelectorAll<HTMLElement>(sel));
      const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
      const add = (sel: string, vars: gsap.TweenVars, at: number) => {
        const els = q(sel);
        if (els.length) tl.from(els, vars, at);
      };
      add('.hero__scrim', { autoAlpha: 0, duration: 1.2, ease: 'power1.out' }, 0);
      add('[data-hr="eyebrow"]', { autoAlpha: 0, y: 14, duration: 0.7 }, 0);
      add('.hero__line-inner', { yPercent: 118, duration: 1.15, ease: 'power4.out', stagger: 0.14 }, 0.05);
      add('[data-hr="lead"]', { autoAlpha: 0, y: 18, duration: 0.9 }, 0.38);
      add('[data-hr="cta"]', { autoAlpha: 0, y: 16, duration: 0.8, stagger: 0.08 }, 0.5);
      add('.hero__value', { autoAlpha: 0, y: 22, duration: 0.9, stagger: 0.1 }, 0.62);
      add('[data-hr="reticle"]', { autoAlpha: 0, scale: 0.9, rotation: -12, duration: 1.8, ease: 'power2.out' }, 0.1);
      add('.hero-tele__inner', { autoAlpha: 0, y: 10, duration: 0.9, stagger: 0.12 }, 0.45);
      add('[data-hr="art"]', { autoAlpha: 0, scale: 0.96, duration: 1.3 }, 0.25);
      add('[data-hr="foot"]', { autoAlpha: 0, y: 10, duration: 0.8 }, 0.95);
      add('.hero__cue > *', { autoAlpha: 0, y: -8, duration: 0.8, stagger: 0.1 }, 1.1);
      revealTl.current = tl;
    }, root);
    return () => {
      ctx.revert();
      revealTl.current = null;
    };
  }, []);

  // Play the reveal on the entrance cue (or shortly after load when the welcome was skipped).
  useEffect(() => {
    const play = (instant: boolean) => {
      if (revealed.current) return;
      revealed.current = true;
      const tl = revealTl.current;
      if (!tl) return;
      if (instant) tl.progress(1);
      else tl.play();
    };
    if (useExperience.getState().welcome === 'hidden') {
      const id = window.setTimeout(() => play(false), 280);
      return () => window.clearTimeout(id);
    }
    const off = onHeroCue(play);
    const unsub = useExperience.subscribe((s) => {
      if (s.welcome === 'hidden') play(false);
    });
    return () => {
      off();
      unsub();
    };
  }, []);

  // Reversible scroll-out scrub (cinematic only).
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !cinematic) return;
    const ctx = gsap.context(() => {
      const vh = () => window.innerHeight;
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
      });
      tl.to('[data-hs="copy"]', { y: () => vh() * 0.26, scale: 0.9, transformOrigin: isAr ? '100% 30%' : '0% 30%', duration: 1 }, 0)
        .to('[data-hs="copy"]', { autoAlpha: 0, duration: 0.45, ease: 'power1.in' }, 0.22)
        .to('[data-hs="values"]', { y: () => vh() * 0.1, autoAlpha: 0, duration: 0.42 }, 0)
        .to('[data-hs="cue"]', { autoAlpha: 0, y: 24, duration: 0.14 }, 0)
        .to('[data-hs="foot"]', { autoAlpha: 0, duration: 0.25 }, 0)
        .to('[data-hs="reticle"]', { scale: 1.45, rotation: 24, autoAlpha: 0, duration: 0.75 }, 0)
        .to(
          '[data-hs="tele"]',
          {
            // Labels sit at different depths: they spread outward (toward their screen edge) and fade as the
            // camera moves on.
            x: (i: number) => (hud.side === 'left' ? -1 : 1) * [70, 120, 90, -60][i % 4],
            y: (i: number) => -vh() * [0.1, 0.04, -0.02, 0.06][i % 4],
            autoAlpha: 0,
            duration: 0.6,
          },
          0.05,
        );
    }, root);
    return () => ctx.revert();
  }, [cinematic, isAr, hud.side]);

  const protectBusiness = () => {
    useCatalog.getState().setAudience('business');
    scrollToId(SECTION_IDS.catalog);
  };

  return (
    <section
      ref={rootRef}
      id={SECTION_IDS.hero}
      className="hero"
      data-mode={mode}
      data-hud={hud.mode}
      data-hud-side={hud.side}
      aria-labelledby="home-title"
    >
      <div className="hero__scrim" aria-hidden="true" />

      {cinematic ? (
        <div className="hero-hud" aria-hidden="true">
          <div className="hero-reticle" data-hs="reticle">
            <svg className="hero-reticle__svg" viewBox="0 0 400 400" fill="none" data-hr="reticle">
              <circle cx="200" cy="200" r="196" stroke="#f3f6fa" strokeOpacity="0.07" />
              <circle cx="200" cy="200" r="188" stroke="#f3f6fa" strokeOpacity="0.2" strokeDasharray="1 6" />
              <path d="M200 0v14M200 386v14M0 200h14M386 200h14" stroke="#35f2c4" strokeOpacity="0.7" />
              <g className="hero-reticle__spin">
                <path d="M62 82A182 182 0 0 1 200 18" stroke="#35f2c4" strokeOpacity="0.55" strokeWidth="1.5" />
                <path d="M338 318A182 182 0 0 1 200 382" stroke="#35f2c4" strokeOpacity="0.3" />
              </g>
            </svg>
          </div>
          {TELEMETRY.map((item) => (
            <div key={item.pos} className={`hero-tele hero-tele--${item.pos}`} data-hs="tele">
              <div className="hero-tele__inner">
                <span className="hero-tele__label telemetry">
                  {item.live ? <i className="hero-tele__dot" /> : <i className="hero-tele__tick" />}
                  {t(item.key)}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div className="container hero__inner">
        <div className="hero__top">
          <div className="hero__copy" data-hs="copy">
            <p className="eyebrow hero__eyebrow" data-hr="eyebrow">
              {t('hero.eyebrow')}
            </p>
            <h1 id="home-title" className="hero__title" tabIndex={-1}>
              <span className="hero__line">
                <span className="hero__line-inner">{t('hero.titleLine1')}</span>
              </span>{' '}
              <span className="hero__line">
                <span className="hero__line-inner hero__line-inner--accent">{t('hero.titleLine2')}</span>
              </span>
            </h1>
            <p className="lead hero__lead" data-hr="lead">
              {t('hero.lead')}
            </p>
            <div className="hero__ctas">
              <button type="button" className="btn btn--primary btn--lg hero__cta" data-hr="cta" onClick={protectBusiness}>
                <ShieldCheck aria-hidden="true" />
                {t('hero.ctaPrimary')}
              </button>
              <button
                type="button"
                className="btn btn--secondary btn--lg hero__cta"
                data-hr="cta"
                onClick={() => scrollToId(SECTION_IDS.constellation)}
              >
                {t('hero.ctaSecondary')}
                <ArrowRight className="icon-flip" aria-hidden="true" />
              </button>
            </div>
          </div>
          {cinematic ? null : <HeroStaticArt />}
        </div>

        <ul className="hero__values" aria-label={t('hero.valuesLabel')} data-hs="values">
          {VALUES.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="hero__value">
              <span className="hero__value-head">
                <span className="hero__value-index" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <Icon className="hero__value-icon" aria-hidden="true" />
              </span>
              <strong className="hero__value-title">{t(title)}</strong>
              <span className="hero__value-text">{t(text)}</span>
            </li>
          ))}
        </ul>

        <div className="hero__foot" data-hr="foot">
          <p className="hero__slogan" data-hs="foot">
            <span lang="en" dir="ltr">
              {translateIn('en', 'common.slogan')}
            </span>
            <span className="hero__slogan-sep" aria-hidden="true" />
            <span lang="ar" dir="rtl">
              {t('common.sloganAr')}
            </span>
          </p>
        </div>
      </div>

      <div className="hero__cue" data-hs="cue" aria-hidden="true">
        <span className="hero__cue-text">{t('common.scrollHint')}</span>
        <span className="hero__cue-line">
          <i />
        </span>
      </div>
    </section>
  );
}
