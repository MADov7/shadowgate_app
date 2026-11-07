// REQUEST BASKET (mounted once in App; open while useUI.basketOpen). Drawer from the inline-end edge.
// Selected package + package selector (real radio group), selected services, empty state, inline
// "clear all" confirmation and a polite live count. Persistence is automatic (zustand persist).
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarCheck, Eye, LayoutGrid, Package, Repeat, Sparkles, Trash2, X } from 'lucide-react';
import { Dialog, DialogClose } from '../components/ui/Dialog';
import { ServiceIcon } from '../components/ui/ServiceIcon';
import { PACKAGES, getPackage } from '../data/packages';
import { getService } from '../data/services';
import type { PackageId, ServiceId } from '../data/types';
import { formatNumber, translate, useI18n } from '../i18n';
import { useBasket, useBasketCount } from '../state/basket';
import { removeServiceFromRequest, selectPackage } from '../state/actions';
import { useUI } from '../state/ui';
import { scrollToId } from '../lib/smoothScroll';
import { usePricingText } from '../sections/Catalog/commerce';
import './BasketDrawer.css';

const RECURRING: Record<PackageId, boolean> = { foundation: false, business: false, continuity: true };

/** Close the drawer first, then navigate once the native dialog has released scroll + focus. */
function closeAndGo(id: string): void {
  useUI.getState().closeBasket();
  window.setTimeout(() => scrollToId(id), 80);
}

function countText(count: number, lang: 'en' | 'ar'): string {
  if (count === 0) return translate('basket.countNone');
  if (count === 1) return translate('basket.countOne');
  return translate('basket.countMany', { count: formatNumber(count, lang) });
}

function ServiceRow({ id, index, onRemove }: { id: ServiceId; index: number; onRemove: (index: number) => void }) {
  const { t, loc } = useI18n();
  const service = getService(id);
  const pricing = usePricingText(service.pricing);
  const name = loc(service.name);
  return (
    <li className="bk-item">
      <span className="bk-item__icon" aria-hidden="true">
        <ServiceIcon name={service.icon} />
      </span>
      <div className="bk-item__text">
        <p className="bk-item__name">{name}</p>
        <p className="bk-item__price" data-kind={pricing.kind}>
          {pricing.kind === 'quote' ? pricing.short : pricing.label}
        </p>
      </div>
      <div className="bk-item__actions">
        <button
          type="button"
          className="btn btn--ghost btn--icon btn--sm bk-icon-btn"
          onClick={() => useUI.getState().openDetails(id)}
          aria-label={t('basket.detailsLabel', { name })}
          title={t('common.viewDetails')}
        >
          <Eye aria-hidden="true" />
        </button>
        <button
          type="button"
          className="btn btn--ghost btn--icon btn--sm bk-icon-btn bk-icon-btn--remove"
          data-remove-index={index}
          onClick={() => onRemove(index)}
          aria-label={t('basket.removeLabel', { name })}
          title={t('common.remove')}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
    </li>
  );
}

function PackageBlock({ id, onChange }: { id: PackageId; onChange: () => void }) {
  const { t, loc } = useI18n();
  const pkg = getPackage(id);
  return (
    <section className="bk-pkg" aria-labelledby="bk-pkg-title">
      <div className="bk-pkg__head">
        <span className="bk-pkg__icon" aria-hidden="true">
          <Package />
        </span>
        <div className="bk-pkg__text">
          <p className="bk-label">{t('basket.packageHeading')}</p>
          <h3 id="bk-pkg-title" className="bk-pkg__name">
            {loc(pkg.name)}
          </h3>
          <p className="bk-pkg__cadence">
            {RECURRING[id] ? <Repeat aria-hidden="true" /> : <CalendarCheck aria-hidden="true" />}
            <span>
              {loc(pkg.cadence) || t(RECURRING[id] ? 'basket.recurring' : 'basket.oneTime')}
              {loc(pkg.duration) ? ` · ${loc(pkg.duration)}` : ''}
            </span>
          </p>
        </div>
      </div>
      <p className="bk-label">{t('basket.packageIncludes')}</p>
      <ul className="bk-pkg__list">
        {pkg.includes.map((sid) => {
          const s = getService(sid);
          return (
            <li key={sid}>
              <button
                type="button"
                className="bk-pkg__svc"
                onClick={() => useUI.getState().openDetails(sid)}
                aria-label={t('basket.detailsLabel', { name: loc(s.name) })}
              >
                <ServiceIcon name={s.icon} />
                <span>{loc(s.name)}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <div className="bk-pkg__actions">
        <button type="button" className="btn btn--secondary btn--sm" onClick={onChange}>
          {t('basket.packageChange')}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => selectPackage(null)}>
          <X aria-hidden="true" />
          {t('basket.packageRemove')}
        </button>
      </div>
    </section>
  );
}

function PackageSelector({ value }: { value: PackageId | null }) {
  const { t, loc } = useI18n();
  const options: Array<{ id: PackageId | null; name: string; hint: string; key: string }> = [
    { id: null, key: 'none', name: t('basket.selectorNone'), hint: t('basket.selectorNoneHint') },
    ...PACKAGES.map((p) => ({
      id: p.id,
      key: p.id,
      name: loc(p.name),
      hint: t('basket.selectorIncludes', { list: p.includes.map((sid) => loc(getService(sid).name)).join(' · ') }),
    })),
  ];
  return (
    <fieldset className="bk-selector" id="bk-selector">
      <legend className="bk-label">{t('basket.selectorLegend')}</legend>
      {options.map((o) => (
        <label key={o.key} className="bk-radio" data-checked={value === o.id ? 'true' : undefined}>
          <input
            type="radio"
            name="bk-package"
            value={o.key}
            checked={value === o.id}
            onChange={() => selectPackage(o.id)}
            aria-describedby={`bk-radio-${o.key}`}
          />
          <span className="bk-radio__mark" aria-hidden="true" />
          <span className="bk-radio__text">
            <span className="bk-radio__name">{o.name}</span>
            <span className="bk-radio__hint" id={`bk-radio-${o.key}`}>
              {o.hint}
            </span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

function DrawerBody({ onClose }: { onClose: () => void }) {
  const { t, lang } = useI18n();
  const serviceIds = useBasket((s) => s.serviceIds);
  const packageId = useBasket((s) => s.packageId);
  const count = useBasketCount();
  const [confirming, setConfirming] = useState(false);
  const clearBtn = useRef<HTMLButtonElement>(null);
  const confirmYes = useRef<HTMLButtonElement>(null);
  const browseBtn = useRef<HTMLButtonElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const empty = count === 0;

  // Removing the focused row unmounts it — keep keyboard focus inside the drawer, on the nearest sensible target.
  const restoreFocus = (index: number) => {
    requestAnimationFrame(() => {
      const root = body.current;
      if (!root) return;
      const rows = root.querySelectorAll<HTMLButtonElement>('[data-remove-index]');
      const next = rows[Math.min(index, rows.length - 1)];
      if (next) next.focus();
      else if (browseBtn.current) browseBtn.current.focus();
      else root.querySelector<HTMLElement>('#bk-services-title')?.focus();
    });
  };
  const removeAt = (index: number) => {
    const id = serviceIds[index];
    if (!id) return;
    removeServiceFromRequest(id);
    restoreFocus(index);
  };

  // Live announcement only for changes made while the drawer is open (not on open).
  const [announce, setAnnounce] = useState('');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setAnnounce(
      count === 0
        ? t('basket.liveNone')
        : count === 1
          ? t('basket.liveOne')
          : t('basket.liveMany', { count: formatNumber(count, lang) }),
    );
  }, [count, t, lang]);

  useEffect(() => {
    if (empty) setConfirming(false);
  }, [empty]);
  useEffect(() => {
    if (confirming) confirmYes.current?.focus();
  }, [confirming]);

  const focusSelector = () => {
    const el = document.querySelector<HTMLInputElement>('#bk-selector input:checked');
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    el?.focus({ preventScroll: true });
  };

  const clearAll = () => {
    const before = { serviceIds: [...serviceIds], packageId };
    useBasket.getState().clear();
    setConfirming(false);
    restoreFocus(0);
    useUI.getState().toast({
      tone: 'info',
      message: t('basket.cleared'),
      action: { label: t('common.undo'), run: () => useBasket.getState().restore(before) },
    });
  };

  return (
    <>
      <header className="sg-dialog__head bk-head">
        <div className="bk-head__text">
          <span className="telemetry" aria-hidden="true">
            {t('basket.eyebrow')}
          </span>
          <div className="bk-head__title">
            <h2 id="basket-title" className="bk-title">
              {t('basket.title')}
            </h2>
            <span className="badge badge--teal bk-count">{countText(count, lang)}</span>
          </div>
          <p id="basket-desc" className="bk-intro">
            {t('basket.intro')}
          </p>
        </div>
        <DialogClose onClick={onClose} />
      </header>

      <div ref={body} className="sg-dialog__body bk-body">
        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {announce}
        </p>

        {empty ? (
          <div className="bk-empty">
            <span className="bk-empty__icon" aria-hidden="true">
              <Package />
            </span>
            <h3 className="bk-empty__title">{t('basket.emptyTitle')}</h3>
            <p className="bk-empty__body">{t('basket.emptyBody')}</p>
            <div className="bk-empty__actions">
              <button ref={browseBtn} type="button" className="btn btn--primary" onClick={() => closeAndGo('catalog')}>
                <LayoutGrid aria-hidden="true" />
                {t('basket.emptyBrowse')}
              </button>
              <button type="button" className="btn btn--secondary" onClick={() => closeAndGo('quiz')}>
                <Sparkles aria-hidden="true" />
                {t('basket.emptyQuiz')}
              </button>
            </div>
          </div>
        ) : null}

        {packageId ? <PackageBlock id={packageId} onChange={focusSelector} /> : null}

        {!empty ? (
          <section className="bk-services" aria-labelledby="bk-services-title">
            <h3 id="bk-services-title" className="bk-label" tabIndex={-1}>
              {t('basket.servicesHeading')}
            </h3>
            {serviceIds.length > 0 ? (
              <ul className="bk-list">
                {serviceIds.map((id, index) => (
                  <ServiceRow key={id} id={id} index={index} onRemove={removeAt} />
                ))}
              </ul>
            ) : (
              <p className="bk-muted">{t('basket.servicesEmptyWithPackage')}</p>
            )}
          </section>
        ) : null}

        <PackageSelector value={packageId} />

        <p className="bk-saved">{t('basket.savedNote')}</p>
      </div>

      {empty ? null : (
      <footer className="sg-dialog__foot bk-foot">
        {confirming ? (
          <div className="bk-confirm" role="group" aria-labelledby="bk-confirm-text">
            <p id="bk-confirm-text" className="bk-confirm__text">
              {t('basket.clearConfirm')}
            </p>
            <div className="bk-confirm__actions">
              <button ref={confirmYes} type="button" className="btn btn--secondary bk-danger" onClick={clearAll}>
                <Trash2 aria-hidden="true" />
                {t('basket.clearYes')}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setConfirming(false);
                  requestAnimationFrame(() => clearBtn.current?.focus());
                }}
              >
                {t('basket.clearNo')}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button type="button" className="btn btn--primary btn--block bk-continue" onClick={() => closeAndGo('contact')}>
              {t('basket.continue')}
              <ArrowRight className="icon-flip" aria-hidden="true" />
            </button>
            <button ref={clearBtn} type="button" className="btn btn--ghost btn--sm bk-clear" onClick={() => setConfirming(true)}>
              <Trash2 aria-hidden="true" />
              {t('basket.clearAll')}
            </button>
          </>
        )}
      </footer>
      )}
    </>
  );
}

export function BasketDrawer() {
  const open = useUI((s) => s.basketOpen);
  const closeBasket = useUI((s) => s.closeBasket);
  return (
    <Dialog open={open} onClose={closeBasket} labelledBy="basket-title" describedBy="basket-desc" variant="drawer" className="bk-drawer">
      <DrawerBody onClose={closeBasket} />
    </Dialog>
  );
}
