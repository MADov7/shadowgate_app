// Full-screen welcome gate + the cinematic entrance.
//
//   visible  → overlay over the closed 3D gate (transparent; world-core renders gate/fog/particles behind it),
//              or over the SVG StaticGate while the 3D chunk loads / in static mode. Scroll is locked.
//   entering → UI lifts away; scrollState.entry animates 0→1 (edge trace → doors → fly-through, ~2.8 s);
//              the hero copy is cued as the camera arrives. Escape / "Skip intro" jumps to the end.
//   hidden   → overlay unmounted, scroll unlocked, focus on the hero h1.
//
// Buttons work instantly at all times — nothing here waits for the 3D scene.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { ArrowRight, CornerDownLeft } from 'lucide-react';
import { LogoLockup } from '../../brand/Logo';
import { LangToggle } from '../../components/layout/Nav';
import { translateIn, useI18n } from '../../i18n';
import { useExperience } from '../../state/experience';
import { scrollState } from '../../state/scroll';
import { getLenis, gsap, lockScroll, scrollToId } from '../../lib/smoothScroll';
import { SECTION_IDS } from '../../lib/choreo';
import { playWhoosh } from '../../lib/audio';
import { SoundToggle } from './SoundToggle';
import { StaticGate } from './StaticGate';
import { ENTRANCE_PLANS, cueHero, entranceKind, overlayAt, type EntranceKind } from './entrance';
import './Welcome.css';

// A skipped welcome (same session / ?intro=0 / deep link) means the world starts inside the gate.
if (useExperience.getState().welcome === 'hidden') scrollState.entry = 1;

const FOCUSABLE = 'button:not([disabled]):not([hidden]), a[href]';

function focusHeroHeading(): void {
  const h1 = document.getElementById('home-title');
  if (!h1) return;
  if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
  h1.focus({ preventScroll: true });
}

export function Welcome() {
  const welcome = useExperience((s) => s.welcome);
  return welcome === 'hidden' ? null : <WelcomeGate />;
}

function WelcomeGate() {
  const { t } = useI18n();
  const welcome = useExperience((s) => s.welcome);
  const setWelcome = useExperience((s) => s.setWelcome);
  const mode = useExperience((s) => s.mode);
  const sceneReady = useExperience((s) => s.sceneReady);

  const [kind, setKind] = useState<EntranceKind | null>(null);
  const [status, setStatus] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const enterRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const doneRef = useRef(false);

  const entering = welcome === 'entering';
  // The SVG gate stands in until the 3D scene has rendered (and always in static / reduced mode).
  const showStatic = kind ? kind !== 'cinematic' : !(mode === 'cinematic' && sceneReady);

  // Scroll lock + start at the top, standing outside the closed gate.
  useEffect(() => {
    lockScroll(true);
    scrollState.entry = 0;
    window.scrollTo(0, 0);
    return () => lockScroll(false);
  }, []);

  // Lenis is created by App after this effect runs (and again if the mode changes) — make sure it is paused.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const lenis = getLenis();
      lenis?.scrollTo(0, { immediate: true, force: true });
      lenis?.stop();
    });
    return () => cancelAnimationFrame(raf);
  }, [mode]);

  useEffect(() => {
    enterRef.current?.focus({ preventScroll: true });
  }, []);

  // Never leave a running timeline behind.
  useEffect(
    () => () => {
      tlRef.current?.kill();
      tlRef.current = null;
    },
    [],
  );

  const finish = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    tlRef.current?.kill();
    tlRef.current = null;
    scrollState.entry = 1;
    cueHero(false);
    setWelcome('hidden'); // unmounts the overlay → scroll unlocks in the effect cleanup
    requestAnimationFrame(focusHeroHeading);
  }, [setWelcome]);

  const applyOverlay = useCallback((entry: number) => {
    const el = rootRef.current;
    if (!el) return;
    const { scrim, flash, tags } = overlayAt(entry);
    el.style.setProperty('--wl-scrim', scrim.toFixed(3));
    el.style.setProperty('--wl-flash', flash.toFixed(3));
    el.style.setProperty('--wl-tags', tags.toFixed(3));
  }, []);

  const enter = useCallback(() => {
    const s = useExperience.getState();
    if (s.welcome !== 'visible' || doneRef.current) return;
    const k = entranceKind({ mode: s.mode, reducedMotion: s.reducedMotion, sceneReady: s.sceneReady });
    const plan = ENTRANCE_PLANS[k];
    setKind(k);
    setStatus(t('welcome.statusOpening'));
    setWelcome('entering');
    playWhoosh();

    const tl = gsap.timeline({ onComplete: finish });
    if (k === 'cinematic') {
      const proxy = { e: scrollState.entry };
      tl.to(
        proxy,
        {
          e: 1,
          duration: plan.total,
          ease: 'none', // ENTRY_PHASES + the camera rig apply their own easing per phase
          onUpdate: () => {
            scrollState.entry = proxy.e;
            applyOverlay(proxy.e);
          },
        },
        0,
      );
    } else {
      // StaticGate / crossfade are pure CSS; the 3D (if it appears later) starts at the hero pose.
      scrollState.entry = 1;
      tl.to({}, { duration: plan.total }, 0);
    }
    tl.call(() => cueHero(false), undefined, plan.heroCue);
    tlRef.current = tl;
    // Keyboard users land on "Skip intro" (Escape works too).
    requestAnimationFrame(() => skipRef.current?.focus({ preventScroll: true }));
  }, [applyOverlay, finish, setWelcome, t]);

  const skip = useCallback(() => {
    const tl = tlRef.current;
    if (tl) tl.progress(1);
    finish();
  }, [finish]);

  const goDirect = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      tlRef.current?.kill();
      tlRef.current = null;
      doneRef.current = true;
      scrollState.entry = 1;
      cueHero(true);
      setWelcome('hidden');
      // Wait for the overlay to unmount (scroll unlocked, main no longer inert), then jump.
      requestAnimationFrame(() =>
        requestAnimationFrame(() => scrollToId(SECTION_IDS.catalog, { immediate: true })),
      );
    },
    [setWelcome],
  );

  // Escape skips the entrance; a deliberate scroll / swipe / PageDown on the welcome page opens the gate.
  useEffect(() => {
    let wheel = 0;
    let wheelTimer = 0;
    let touchY: number | null = null;
    const onKey = (e: KeyboardEvent) => {
      const state = useExperience.getState().welcome;
      if (e.key === 'Escape' && state === 'entering') {
        e.preventDefault();
        skip();
      } else if (state === 'visible' && (e.key === 'PageDown' || e.key === 'ArrowDown')) {
        e.preventDefault();
        enter();
      }
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY <= 0) return;
      wheel += e.deltaY;
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => (wheel = 0), 260);
      if (wheel > 70) {
        wheel = 0;
        enter();
      }
    };
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchY === null) return;
      const y = e.touches[0]?.clientY ?? touchY;
      if (touchY - y > 60) {
        touchY = null;
        enter();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    return () => {
      window.clearTimeout(wheelTimer);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
    };
  }, [enter, skip]);

  // Keep Tab inside the welcome page (the rest of the page is inert behind it).
  const trapTab = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !rootRef.current) return;
    const items = Array.from(rootRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.closest('[inert]') && el.getClientRects().length > 0,
    );
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const worldStatus =
    mode === 'static' ? t('welcome.worldStatic') : sceneReady ? t('welcome.worldReady') : t('welcome.worldLoading');
  const worldTone = mode === 'static' ? 'static' : sceneReady ? 'ready' : 'loading';

  return (
    <div
      ref={rootRef}
      className="wl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wl-title"
      data-state={welcome}
      data-kind={kind ?? 'none'}
      data-static={showStatic}
      onKeyDown={trapTab}
    >
      <StaticGate state={entering && kind === 'static' ? 'opening' : 'idle'} hidden={!showStatic} />
      <div className="wl__scrim" aria-hidden="true" />
      <div className="wl__flash" aria-hidden="true" />
      <div className="wl__grain" aria-hidden="true" />

      <div className="wl__hud" aria-hidden="true">
        <span className="wl__corner wl__corner--ts" />
        <span className="wl__corner wl__corner--te" />
        <span className="wl__corner wl__corner--bs" />
        <span className="wl__corner wl__corner--be" />
        <span className="wl__rule wl__rule--start" />
        <span className="wl__rule wl__rule--end" />
        <span className="wl__scanline" />
      </div>

      <div className="wl__tags" aria-hidden="true">
        <span className="wl__tag wl__tag--top telemetry">
          <i className="wl__dot" data-tone={entering ? 'open' : 'sealed'} />
          {entering ? t('welcome.gateOpening') : t('welcome.gateSealed')}
        </span>
        <span className="wl__tag wl__tag--start telemetry">
          <span>{t('welcome.access')}</span>
          <span className="wl__tag-sub">{t('welcome.accessNode')}</span>
        </span>
        <span className="wl__tag wl__tag--end telemetry">
          <span>{entering ? t('welcome.perimeterOpen') : t('welcome.perimeter')}</span>
          <span className="wl__tag-sub">{t('welcome.visitor')}</span>
        </span>
      </div>

      <header className="wl__top" inert={entering ? true : undefined}>
        <span className="wl__brand">
          <LogoLockup label={t('welcome.brandLabel')} />
        </span>
        <span className="wl__top-tele telemetry" aria-hidden="true">
          {t('welcome.access')}
          <span className="wl__sep" />
          {t('welcome.visitor')}
        </span>
        <div className="wl__controls" role="group" aria-label={t('welcome.controlsLabel')}>
          <LangToggle />
          <SoundToggle />
        </div>
      </header>

      <div className="wl__content" inert={entering ? true : undefined}>
        <p className="eyebrow wl__eyebrow">{t('welcome.eyebrow')}</p>
        <h1 id="wl-title" className="wl__title">
          {t('welcome.title')}
        </h1>
        <div className="wl__actions">
          <span className="wl__enter-wrap">
            <span className="wl__enter-halo" aria-hidden="true" />
            <button ref={enterRef} type="button" className="btn btn--primary btn--lg wl__enter" onClick={enter}>
              <span>{t('welcome.enter')}</span>
              <ArrowRight className="icon-flip" aria-hidden="true" />
              <kbd className="wl__enter-kbd" aria-hidden="true">
                <CornerDownLeft />
              </kbd>
            </button>
          </span>
          <a href={`#${SECTION_IDS.catalog}`} className="btn btn--ghost wl__direct" onClick={goDirect}>
            {t('welcome.direct')}
            <ArrowRight className="icon-flip" aria-hidden="true" />
          </a>
        </div>
        <p className="wl__slogan">
          <span lang="en" dir="ltr">
            {translateIn('en', 'common.slogan')}
          </span>
          <span className="wl__slogan-sep" aria-hidden="true" />
          <span lang="ar" dir="rtl">
            {t('common.sloganAr')}
          </span>
        </p>
      </div>

      <footer className="wl__bottom" aria-hidden="true">
        <span className="telemetry wl__world">
          <i className="wl__dot" data-tone={worldTone} />
          {worldStatus}
        </span>
        <span className="telemetry wl__keys">
          {t('welcome.keysHint')}
          <span className="kbd">↵</span>
        </span>
      </footer>

      <button ref={skipRef} type="button" className="btn btn--secondary btn--sm wl__skip" hidden={!entering} onClick={skip}>
        {t('welcome.skip')}
        <span className="kbd" aria-hidden="true">
          {t('welcome.skipKey')}
        </span>
      </button>

      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
