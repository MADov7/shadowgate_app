// OWNER: conversion agent. Placeholder — replace with the real implementation.
import { useI18n } from '../../i18n';

export function Contact() {
  const { t } = useI18n();
  return (
    <section id="contact" className="section" aria-labelledby="contact-title">
      <div className="container"><h2 id="contact-title" className="h2">{t('contact.title')}</h2></div>
    </section>
  );
}
