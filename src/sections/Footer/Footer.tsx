// OWNER: conversion agent. Placeholder footer.
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
