// SERVICE DETAILS (mounted once in App; open while useUI.detailsId != null).
// Everything a buyer needs before choosing: scope, exclusions, deliverables, estimate, honest pricing,
// authorization requirement (pen testing) and package coverage. Built on the shared native <dialog>.
import { useRef } from 'react';
import { Clock, Info, PackageCheck, ShieldCheck, Tag } from 'lucide-react';
import { Dialog, DialogClose } from '../components/ui/Dialog';
import { ServiceIcon } from '../components/ui/ServiceIcon';
import { categoryById } from '../data/categories';
import { getPackage } from '../data/packages';
import { getService, isServiceId } from '../data/services';
import type { Service } from '../data/types';
import { useI18n } from '../i18n';
import { useUI } from '../state/ui';
import { AddToRequestButton, PrimaryActionButton, usePricingText, useRequestState } from '../sections/Catalog/commerce';
import './ServiceDetailsDialog.css';

/** Content arrays can contain empty placeholder strings while copy is drafted — never render empty bullets. */
function filled(list: readonly string[]): string[] {
  return list.map((s) => s.trim()).filter(Boolean);
}

function DetailsBody({ service, onClose }: { service: Service; onClose: () => void }) {
  const { t, loc, locList } = useI18n();
  const pricing = usePricingText(service.pricing);
  const { state, packageId } = useRequestState(service.id);
  const category = categoryById(service.category);
  const scope = filled(locList(service.scope));
  const exclusions = filled(locList(service.exclusions));
  const deliverables = filled(locList(service.deliverables));
  const summary = loc(service.summary);
  const audienceText = loc(service.audienceText);
  const isBook = service.primaryAction === 'book';

  return (
    <>
      <header className="sg-dialog__head sd-head">
        <div className="sd-head__main">
          <span className="sd-icon" aria-hidden="true">
            <ServiceIcon name={service.icon} />
          </span>
          <div className="sd-head__text">
            <div className="sd-badges">
              <span className="badge badge--teal">
                {t(service.audience === 'business' ? 'details.audienceBusiness' : 'details.audiencePersonal')}
              </span>
              <span className="badge">{loc(category.label)}</span>
              {service.requiresAuthorization ? (
                <span className="badge sd-badge-auth">
                  <ShieldCheck aria-hidden="true" />
                  {t('details.authTitle')}
                </span>
              ) : null}
            </div>
            <h2 id="details-title" className="sd-title">
              {loc(service.name)}
            </h2>
          </div>
        </div>
        <DialogClose onClick={onClose} />
      </header>

      <div className="sg-dialog__body sd-body">
        <p id="details-benefit" className="sd-benefit">
          {loc(service.benefit)}
        </p>
        {summary ? <p className="sd-summary">{summary}</p> : null}

        {state === 'included' && packageId ? (
          <div className="sd-callout sd-callout--teal" role="note">
            <PackageCheck aria-hidden="true" />
            <div>
              <p className="sd-callout__title">{t('details.coveredTitle')}</p>
              <p>{t('details.coveredBody', { pkg: loc(getPackage(packageId).name) })}</p>
            </div>
          </div>
        ) : null}

        {service.requiresAuthorization ? (
          <div className="sd-callout sd-callout--amber" role="note">
            <ShieldCheck aria-hidden="true" />
            <div>
              <p className="sd-callout__title">{t('details.authTitle')}</p>
              <p>{t('details.authBody')}</p>
            </div>
          </div>
        ) : null}

        {audienceText ? (
          <section className="sd-block" aria-labelledby="sd-who">
            <h3 id="sd-who" className="sd-block__title">
              {t('details.whoFor')}
            </h3>
            <p className="sd-block__text">{audienceText}</p>
          </section>
        ) : null}

        <div className="sd-grid">
          {scope.length > 0 ? (
            <section className="sd-block sd-block--panel" aria-labelledby="sd-scope">
              <h3 id="sd-scope" className="sd-block__title">
                {t('details.scope')}
              </h3>
              <ul className="list-check">
                {scope.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
          {exclusions.length > 0 ? (
            <section className="sd-block sd-block--panel" aria-labelledby="sd-excl">
              <h3 id="sd-excl" className="sd-block__title">
                {t('details.exclusions')}
              </h3>
              <ul className="list-check list-x">
                {exclusions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {deliverables.length > 0 ? (
          <section className="sd-block sd-block--panel sd-block--deliver" aria-labelledby="sd-deliver">
            <h3 id="sd-deliver" className="sd-block__title">
              {t('details.deliverables')}
            </h3>
            <ul className="list-check">
              {deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <dl className="sd-facts">
          <div className="sd-fact">
            <dt>
              <Clock aria-hidden="true" />
              {t('details.duration')}
            </dt>
            <dd>
              <span className="sd-fact__value">{loc(service.duration)}</span>
              <span className="sd-fact__note">{t('common.estimateNote')}</span>
            </dd>
          </div>
          <div className="sd-fact" data-kind={pricing.kind}>
            <dt>
              <Tag aria-hidden="true" />
              {t('details.pricing')}
            </dt>
            <dd>
              <span className="sd-fact__value">{pricing.label}</span>
              <span className="sd-fact__note">{pricing.note}</span>
            </dd>
          </div>
        </dl>

        {isBook ? (
          <p className="sd-note">
            <Info aria-hidden="true" />
            <span>
              {t('details.bookNote')} {t('details.personalAddHint')}
            </span>
          </p>
        ) : null}
      </div>

      <footer className="sg-dialog__foot sd-foot">
        <button type="button" className="btn btn--ghost sd-foot__close" onClick={onClose}>
          {t('common.close')}
        </button>
        {isBook ? <AddToRequestButton service={service} variant="secondary" verbose /> : null}
        <PrimaryActionButton service={service} verbose />
      </footer>
    </>
  );
}

export function ServiceDetailsDialog() {
  const detailsId = useUI((s) => s.detailsId);
  const closeDetails = useUI((s) => s.closeDetails);
  // Keep the last service rendered while the native dialog closes (children unmount with `open`).
  const lastId = useRef(detailsId);
  if (detailsId) lastId.current = detailsId;
  const id = detailsId ?? lastId.current;
  const service = id && isServiceId(id) ? getService(id) : null;

  return (
    <Dialog
      open={detailsId !== null && service !== null}
      onClose={closeDetails}
      labelledBy="details-title"
      describedBy="details-benefit"
      className="sd-dialog"
    >
      {service ? <DetailsBody service={service} onClose={closeDetails} /> : null}
    </Dialog>
  );
}
