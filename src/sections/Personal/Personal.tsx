// OWNER: conversion agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Personal() {
  const { t } = useI18n();
  return (
    <section id="personal" className="section" aria-labelledby="personal-title">
      <div className="container"><h2 id="personal-title" className="h2">{t('personal.title')}</h2></div>
    </section>
  );
}
