// One-off scaffolding: writes placeholder section/overlay/3D components that builder agents replace.
// Existing files are never overwritten.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const files = {};

function section(name, id, owner, { scrolly = null, extra = '' } = {}) {
  const cls = scrolly ? 'scrolly' : 'section';
  const style = scrolly ? ` style={{ ['--scrolly-h' as string]: '${scrolly}' }}` : '';
  const inner = scrolly
    ? `<div className="scrolly__pin"><div className="container"><h2 className="h2">{t('${name.toLowerCase()}.title')}</h2></div></div>`
    : `<div className="container"><h2 className="h2">{t('${name.toLowerCase()}.title')}</h2></div>`;
  return `// OWNER: ${owner}. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';
${extra}
export function ${name}() {
  const { t } = useI18n();
  return (
    <section id="${id}" className="${cls}" aria-labelledby="${id}-title"${style}>
      ${inner.replace('<h2 className="h2">', `<h2 id="${id}-title" className="h2">`)}
    </section>
  );
}
`;
}

files['sections/Hero/Hero.tsx'] = section('Hero', 'home', 'welcome-hero agent');
files['sections/Radar/Radar.tsx'] = section('Radar', 'radar', 'radar agent', { scrolly: '230vh' });
files['sections/Layers/Layers.tsx'] = section('Layers', 'layers', 'guidance agent', { scrolly: '320vh' });
files['sections/Simulation/Simulation.tsx'] = section('Simulation', 'simulation', 'guidance agent');
files['sections/Constellation/Constellation.tsx'] = section('Constellation', 'explore', 'world-scenes agent', { scrolly: '300vh' });
files['sections/Catalog/Catalog.tsx'] = section('Catalog', 'catalog', 'commerce agent');
files['sections/Quiz/Quiz.tsx'] = section('Quiz', 'quiz', 'guidance agent');
files['sections/Packages/Packages.tsx'] = section('Packages', 'packages', 'commerce agent');
files['sections/Build/Build.tsx'] = section('Build', 'build', 'conversion agent', { scrolly: '160vh' });
files['sections/Personal/Personal.tsx'] = section('Personal', 'personal', 'conversion agent');
files['sections/Contact/Contact.tsx'] = section('Contact', 'contact', 'conversion agent');
files['sections/BrandAbout/BrandAbout.tsx'] = section('Brand', 'about-brand', 'conversion agent').replace(
  'export function Brand()',
  'export function BrandAbout()',
);

files['sections/Footer/Footer.tsx'] = `// OWNER: conversion agent. Placeholder footer.
import { useI18n } from '../../i18n';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="section">
      <div className="container">
        <p className="muted">{t('footer.title')}</p>
      </div>
    </footer>
  );
}
`;

files['sections/Welcome/Welcome.tsx'] = `// OWNER: welcome-hero agent. Placeholder: hides itself immediately so the site is usable.
import { useEffect } from 'react';
import { useExperience } from '../../state/experience';
import { scrollState } from '../../state/scroll';

export function Welcome() {
  const welcome = useExperience((s) => s.welcome);
  const setWelcome = useExperience((s) => s.setWelcome);
  useEffect(() => {
    scrollState.entry = 1;
    if (welcome !== 'hidden') setWelcome('hidden');
  }, [welcome, setWelcome]);
  return null;
}
`;

files['sections/Welcome/SoundToggle.tsx'] = `// OWNER: welcome-hero agent. Placeholder sound toggle (ambient audio is muted by default).
export function SoundToggle(_props: { compact?: boolean }) {
  return null;
}
`;

files['overlays/ServiceDetailsDialog.tsx'] = `// OWNER: commerce agent. Placeholder.
export function ServiceDetailsDialog() {
  return null;
}
`;
files['overlays/BasketDrawer.tsx'] = `// OWNER: commerce agent. Placeholder.
export function BasketDrawer() {
  return null;
}
`;
files['overlays/BookingDialog.tsx'] = `// OWNER: conversion agent. Placeholder.
export function BookingDialog() {
  return null;
}
`;

const three = {
  Atmosphere: 'world-core agent — fog, floor grid, lights, ambient dust, horizon glow',
  Gate: 'world-core agent — procedural metallic gateway, edge light trace, opening leaves',
  ParticleField: 'world-core agent — data particles: gate stream → data core → globe morph',
  ThreatArcs: 'world-core agent — simulated threat arcs on the globe, synced with useRadar',
  Effects: 'world-core agent — controlled post-processing (bloom/vignette), quality-gated',
  DefenseNetwork: 'world-scenes agent — company network nodes + five protection layers',
  ServiceConstellation: 'world-scenes agent — Hamol-style constellation of 8 service objects',
  BuildStructure: 'world-scenes agent — symbolic structure completed by the request basket',
  HorizonGate: 'world-scenes agent — final gate opening toward a calm teal horizon',
};
for (const [name, owner] of Object.entries(three)) {
  files[`three/${name}.tsx`] = `// OWNER: ${owner}. Placeholder.
export function ${name}() {
  return null;
}
`;
}

for (const [rel, content] of Object.entries(files)) {
  const path = root + rel;
  if (existsSync(path)) continue;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}
console.log('stubs ok:', Object.keys(files).length);
