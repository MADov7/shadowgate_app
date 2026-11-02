// OWNER: conversion agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Build() {
  const { t } = useI18n();
  return (
    <section id="build" className="scrolly" aria-labelledby="build-title" style={{ ['--scrolly-h' as string]: '160vh' }}>
      <div className="scrolly__pin"><div className="container"><h2 id="build-title" className="h2">{t('build.title')}</h2></div></div>
    </section>
  );
}
