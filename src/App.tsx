import { lazy, Suspense, useEffect } from 'react';
import { useI18n } from './i18n';
import { applyModeToDocument, useExperience } from './state/experience';
import { initScroll, scheduleRefresh, scrollToId } from './lib/smoothScroll';
import { Nav } from './components/layout/Nav';
import { Toaster } from './components/ui/Toaster';
import { Welcome } from './sections/Welcome/Welcome';
import { Hero } from './sections/Hero/Hero';
import { Radar } from './sections/Radar/Radar';
import { Layers } from './sections/Layers/Layers';
import { Simulation } from './sections/Simulation/Simulation';
import { Constellation } from './sections/Constellation/Constellation';
import { Catalog } from './sections/Catalog/Catalog';
import { Quiz } from './sections/Quiz/Quiz';
import { Packages } from './sections/Packages/Packages';
import { Build } from './sections/Build/Build';
import { Personal } from './sections/Personal/Personal';
import { Contact } from './sections/Contact/Contact';
import { BrandAbout } from './sections/BrandAbout/BrandAbout';
import { Footer } from './sections/Footer/Footer';
import { ServiceDetailsDialog } from './overlays/ServiceDetailsDialog';
import { BasketDrawer } from './overlays/BasketDrawer';
import { BookingDialog } from './overlays/BookingDialog';
import './App.css';

// three.js + R3F load in their own chunk, after the essential UI.
const Stage = lazy(() => import('./three/Stage'));

export default function App() {
  const { t, lang } = useI18n();
  const mode = useExperience((s) => s.mode);
  const reduced = useExperience((s) => s.reducedMotion);
  const welcome = useExperience((s) => s.welcome);

  useEffect(() => applyModeToDocument(mode, reduced), [mode, reduced]);

  // One scroll system for the whole page; smooth wheel only in the cinematic experience.
  useEffect(() => initScroll({ smooth: mode === 'cinematic' }), [mode]);

  // Language switches change text length and direction → re-measure every scroll trigger.
  useEffect(() => scheduleRefresh(60), [lang]);

  // Deep link on load (e.g. /#catalog): jump straight there once layout exists.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => scrollToId(id, { immediate: true, focus: false }));
  }, []);

  // Route every in-page anchor (inside sections, footer, dialogs) through the shared scroll system.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href^="#"]');
      if (!anchor) return;
      const id = anchor.getAttribute('href')?.slice(1);
      if (!id || !document.getElementById(id)) return;
      event.preventDefault();
      scrollToId(id);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  return (
    <>
      <a className="skip-link" href="#main">
        {t('common.skipToContent')}
      </a>
      {mode === 'cinematic' ? (
        <Suspense fallback={null}>
          <Stage />
        </Suspense>
      ) : (
        <div className="sg-static-bg" aria-hidden="true" />
      )}
      <div className="sg-atmo" aria-hidden="true" />
      <Welcome />
      <Nav />
      <main id="main" tabIndex={-1} inert={welcome !== 'hidden' ? true : undefined}>
        <Hero />
        <Radar />
        <Layers />
        <Simulation />
        <Constellation />
        <Catalog />
        <Quiz />
        <Packages />
        <Build />
        <Personal />
        <Contact />
        <BrandAbout />
      </main>
      <Footer />
      <ServiceDetailsDialog />
      <BasketDrawer />
      <BookingDialog />
      <Toaster />
    </>
  );
}
