// TEMPORARY radar QA harness (isolated from other sections while they are being built). Not shipped.
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/700.css';
import '@fontsource-variable/jetbrains-mono';
import '../../../styles/tokens.css';
import '../../../styles/base.css';
import '../../../App.css';
import { applyLangToDocument, useLangStore } from '../../../i18n';
import { applyModeToDocument, useExperience } from '../../../state/experience';
import { initScroll } from '../../../lib/smoothScroll';
import { Radar } from '../Radar';

function Harness() {
  const mode = useExperience((s) => s.mode);
  useEffect(() => initScroll({ smooth: mode === 'cinematic' }), [mode]);
  return (
    <>
      <div className={mode === 'cinematic' ? 'qa-globe' : 'sg-static-bg'} aria-hidden="true" />
      <main id="main">
        <section id="home" style={{ height: '100vh' }} />
        <Radar />
        <section id="layers" style={{ height: '120vh' }} />
        <section id="catalog" style={{ height: '100vh' }}><h2>catalog</h2></section>
      </main>
    </>
  );
}

applyLangToDocument(useLangStore.getState().lang);
const exp = useExperience.getState();
applyModeToDocument(exp.mode, exp.reducedMotion);
const style = document.createElement('style');
// Stand-in for the 3D globe (drawn by world-core in the real page) so the composition can be judged.
style.textContent = `.qa-globe{position:fixed;inset:0;z-index:0;background:radial-gradient(circle at 34% 52%, rgba(53,242,196,.10) 0 30%, rgba(53,242,196,.03) 31%, transparent 32%), #070b14}`;
document.head.appendChild(style);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Harness />
  </StrictMode>,
);
