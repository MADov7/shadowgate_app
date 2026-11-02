// OWNER: conversion agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function BrandAbout() {
  const { t } = useI18n();
  return (
    <section id="about-brand" className="section" aria-labelledby="about-brand-title">
      <div className="container"><h2 id="about-brand-title" className="h2">{t('brand.title')}</h2></div>
    </section>
  );
}
