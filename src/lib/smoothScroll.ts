// One coordinated scroll model: Lenis (smooth wheel, cinematic mode only) driving GSAP ScrollTrigger,
// plus the world timeline T written to scrollState on every tick.
// Keyboard, touch, anchors and forms keep native behaviour: Lenis only smooths the wheel (syncTouch off),
// and in static / reduced-motion mode we use plain native scrolling.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { scrollState } from '../state/scroll';
import { measureAnchors, tFromScroll, type MeasuredAnchor } from './choreo';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let anchors: MeasuredAnchor[] = [];
let lastY = 0;
let lastTime = 0;

export function getLenis(): Lenis | null {
  return lenis;
}

function updateScrollState(): void {
  const y = lenis ? lenis.scroll : window.scrollY;
  const now = performance.now();
  const dt = Math.max(1, now - lastTime);
  const instant = ((y - lastY) / dt) * 1000;
  scrollState.velocity = scrollState.velocity * 0.8 + instant * 0.2;
  lastY = y;
  lastTime = now;
  scrollState.y = y;
  scrollState.vh = window.innerHeight;
  scrollState.T = tFromScroll(y, anchors);
}

export function remeasure(): void {
  anchors = measureAnchors(document, window.innerHeight);
  updateScrollState();
}

let refreshTimer = 0;
/** Debounced ScrollTrigger refresh — call after layout changes (filtering, language switch, accordions). */
export function scheduleRefresh(delay = 120): void {
  window.clearTimeout(refreshTimer);
  refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), delay);
}

/**
 * Starts the scroll system. `smooth` = Lenis wheel smoothing (cinematic mode only).
 * Returns a cleanup function.
 */
export function initScroll({ smooth }: { smooth: boolean }): () => void {
  const cleanups: Array<() => void> = [];

  if (smooth) {
    lenis = new Lenis({ autoRaf: false, lerp: 0.11, smoothWheel: true, syncTouch: false, anchors: false });
    const instance = lenis;
    // Exposed for QA scripts (scripts/shot.mjs, e2e) to jump instantly; harmless in production.
    (window as unknown as { __lenis?: Lenis }).__lenis = instance;
    instance.on('scroll', () => {
      ScrollTrigger.update();
      updateScrollState();
    });
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    cleanups.push(() => {
      gsap.ticker.remove(tick);
      instance.destroy();
      if (lenis === instance) lenis = null;
    });
  } else {
    const onScroll = () => updateScrollState();
    window.addEventListener('scroll', onScroll, { passive: true });
    cleanups.push(() => window.removeEventListener('scroll', onScroll));
  }

  ScrollTrigger.addEventListener('refresh', remeasure);
  cleanups.push(() => ScrollTrigger.removeEventListener('refresh', remeasure));

  // Content height changes (catalog filtering, language switch, fonts) must re-measure every trigger.
  const ro = new ResizeObserver(() => scheduleRefresh());
  ro.observe(document.body);
  cleanups.push(() => ro.disconnect());

  const onPointer = (e: PointerEvent) => {
    scrollState.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
    scrollState.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
  };
  window.addEventListener('pointermove', onPointer, { passive: true });
  cleanups.push(() => window.removeEventListener('pointermove', onPointer));

  document.fonts?.ready.then(() => scheduleRefresh(0)).catch(() => {});
  remeasure();
  ScrollTrigger.refresh();

  return () => {
    window.clearTimeout(refreshTimer);
    cleanups.forEach((fn) => fn());
  };
}

let lockCount = 0;
/**
 * Pause/resume page scrolling (dialogs, welcome overlay). Reference-counted: every lockScroll(true)
 * must be paired with one lockScroll(false), so stacked overlays don't unlock each other.
 */
export function lockScroll(locked: boolean): void {
  lockCount = Math.max(0, lockCount + (locked ? 1 : -1));
  const isLocked = lockCount > 0;
  document.documentElement.classList.toggle('is-locked', isLocked);
  if (isLocked) lenis?.stop();
  else lenis?.start();
}

function focusSection(el: HTMLElement): void {
  const target =
    el.querySelector<HTMLElement>('[data-focus-target]') ?? el.querySelector<HTMLElement>('h1, h2') ?? el;
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}

/**
 * Accessible in-page navigation: scrolls to a section (smooth unless reduced motion) and moves keyboard
 * focus to its heading so screen-reader and keyboard users land in the right place.
 */
export function scrollToId(id: string, opts: { immediate?: boolean; focus?: boolean } = {}): void {
  const el = document.getElementById(id);
  if (!el) return;
  const reduced = document.documentElement.dataset.motion === 'reduced';
  const immediate = opts.immediate || reduced;
  const done = () => {
    if (opts.focus !== false) focusSection(el);
  };
  if (history.replaceState) history.replaceState(null, '', `#${id}`);
  if (lenis) {
    lenis.scrollTo(el, { immediate, duration: 1.3, force: true, onComplete: done });
    if (immediate) done();
  } else {
    el.scrollIntoView({ behavior: immediate ? 'auto' : 'smooth', block: 'start' });
    window.setTimeout(done, immediate ? 0 : 600);
  }
}

export { gsap, ScrollTrigger };
