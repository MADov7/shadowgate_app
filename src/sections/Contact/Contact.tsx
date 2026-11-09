// Request form (#contact). The calm horizon of the 3D world sits behind; the form lives in a solid glass panel.
// Honest by design: submitting validates, then saves the request in this browser only (src/lib/requests.ts)
// and says exactly that — "Demo request saved in this browser. No message has been sent."
import { useEffect, useId, useState, type FormEvent } from 'react';
import Link from 'next/link';
import type { PublicOrder } from '../../data/orderTypes';
import { useSession } from '../../state/session';
import { orderErrorKey } from '../../lib/orderErrors';
import {
  ArrowRight,
  CheckCircle2,
  Eraser,
  FileSignature,
  FileText,
  LayoutGrid,
  LogIn,
  PackageCheck,
  Pencil,
  PhoneCall,
  RotateCcw,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useI18n, type TKey } from '../../i18n';
import { useBasket, type BasketSnapshot } from '../../state/basket';
import { useUI } from '../../state/ui';
import { getService } from '../../data/services';
import { getPackage } from '../../data/packages';
import { SECTION_IDS } from '../../lib/choreo';
import { scheduleRefresh } from '../../lib/smoothScroll';
import {
  clearDemoData,
  requestNeedsAuthorization,
  saveRequest,
  type DemoRequestRecord,
  type SaveResult,
} from '../../lib/requests';
import {
  EMPTY_REQUEST_FORM,
  LIMITS,
  errorFields,
  hasErrors,
  normalizeDigits,
  validateRequestForm,
  type CustomerType,
  type RequestField,
  type RequestFormValues,
} from '../../lib/validation';
import { ServiceIcon } from '../../components/ui/ServiceIcon';
import { ErrorSummary, FieldErrorText, describedBy, errorMessage, focusControl } from './FormParts';
import './Contact.css';

const FIELD_LABEL: Record<RequestField, TKey> = {
  fullName: 'contact.fullName',
  email: 'contact.email',
  organisation: 'contact.organisation',
  customerType: 'contact.customerType',
  phone: 'contact.phone',
  contactMethod: 'contact.contactMethod',
  message: 'contact.message',
  authorization: 'contact.authorizationShort',
  acknowledge: 'contact.acknowledgeShort',
};

/** id of the control that receives focus for each field (radio groups → their first option). */
function controlId(field: RequestField): string {
  if (field === 'customerType') return 'cf-customerType-business';
  if (field === 'contactMethod') return 'cf-contactMethod-email';
  return `cf-${field}`;
}

export function Contact() {
  const { t } = useI18n();
  const [saved, setSaved] = useState<SaveResult<DemoRequestRecord> | null>(null);
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const signedIn = useSession((s) => s.status === 'signed-in');
  const [formKey, setFormKey] = useState(0);

  useEffect(() => scheduleRefresh(), [saved, order]);

  return (
    <section id={SECTION_IDS.contact} className="section contact" aria-labelledby="contact-title">
      <div className="container contact__grid">
        <div className="contact__intro">
          <header className="contact__head">
            <p className="eyebrow">{t('contact.eyebrow')}</p>
            <h2 id="contact-title" className="h2">
              {t('contact.title')}
            </h2>
            <p className="lead">{signedIn ? t('auth.contactLeadAccount') : t('contact.lead')}</p>
          </header>
          <CurrentRequest />
          <RealEngagement />
        </div>

        <div className="panel contact__panel">
          {order ? (
            <OrderConfirmation
              order={order}
              onNew={() => {
                setOrder(null);
                setFormKey((k) => k + 1);
                requestAnimationFrame(() => focusControl('cf-fullName'));
              }}
            />
          ) : saved ? (
            <Confirmation
              result={saved}
              onNew={() => {
                setSaved(null);
                setFormKey((k) => k + 1);
                requestAnimationFrame(() => focusControl('cf-fullName'));
              }}
            />
          ) : (
            <RequestForm key={formKey} onSaved={setSaved} onOrder={setOrder} />
          )}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------------------------
function CurrentRequest() {
  const { t, loc } = useI18n();
  const serviceIds = useBasket((s) => s.serviceIds);
  const packageId = useBasket((s) => s.packageId);
  const pkg = packageId ? getPackage(packageId) : null;
  const total = serviceIds.length + (pkg ? 1 : 0);
  const needsAuth = requestNeedsAuthorization(serviceIds, packageId);

  return (
    <div className="contact-req">
      <div className="contact-req__head">
        <h3 id="contact-req-title" className="contact-req__title">
          {t('contact.requestTitle')}
        </h3>
        <span className="badge badge--teal">{t('contact.requestCount', { count: total })}</span>
        <button
          type="button"
          className="btn btn--ghost btn--sm contact-req__edit"
          aria-label={t('contact.editLabel')}
          onClick={() => useUI.getState().openBasket()}
        >
          <Pencil aria-hidden="true" />
          {t('contact.edit')}
        </button>
      </div>
      {total === 0 ? (
        <div className="contact-req__empty">
          <p>{t('contact.requestEmpty')}</p>
          <a className="btn btn--secondary btn--sm" href={`#${SECTION_IDS.catalog}`}>
            <LayoutGrid aria-hidden="true" />
            {t('contact.browse')}
          </a>
        </div>
      ) : (
        <ul className="contact-req__list">
          {pkg ? (
            <li className="contact-req__item contact-req__item--pkg">
              <PackageCheck aria-hidden="true" />
              <span>
                <span className="contact-req__tag">{t('contact.packageTag')}</span> {loc(pkg.name)}
              </span>
            </li>
          ) : null}
          {serviceIds.map((id) => {
            const s = getService(id);
            return (
              <li key={id} className="contact-req__item">
                <ServiceIcon name={s.icon} />
                <span>{loc(s.name)}</span>
              </li>
            );
          })}
        </ul>
      )}
      {needsAuth ? (
        <p className="contact-req__auth">
          <ShieldAlert aria-hidden="true" />
          {t('common.authorizationRequired')}
        </p>
      ) : null}
    </div>
  );
}

function RealEngagement() {
  const { t } = useI18n();
  const items: Array<{ icon: typeof PhoneCall; key: TKey }> = [
    { icon: PhoneCall, key: 'contact.real1' },
    { icon: FileText, key: 'contact.real2' },
    { icon: FileSignature, key: 'contact.real3' },
  ];
  return (
    <div className="contact-real">
      <p className="contact-real__title">{t('contact.realTitle')}</p>
      <ol className="contact-real__list">
        {items.map(({ icon: Icon, key }) => (
          <li key={key}>
            <Icon aria-hidden="true" />
            <span>{t(key)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
function RequestForm({
  onSaved,
  onOrder,
}: {
  onSaved: (result: SaveResult<DemoRequestRecord>) => void;
  onOrder: (order: PublicOrder) => void;
}) {
  const { t, lang } = useI18n();
  const uid = useId();
  const serviceIds = useBasket((s) => s.serviceIds);
  const packageId = useBasket((s) => s.packageId);
  const needsAuth = requestNeedsAuthorization(serviceIds, packageId);
  const sessionUser = useSession((s) => (s.status === 'signed-in' ? s.user : null));
  const [values, setValues] = useState<RequestFormValues>(() => ({
    ...EMPTY_REQUEST_FORM,
    fullName: sessionUser?.name ?? '',
    email: sessionUser?.email ?? '',
  }));
  // Prefill name + email once the session (GET /api/auth/me) has loaded them; never overwrite what the user typed.
  useEffect(() => {
    if (!sessionUser) return;
    setValues((prev) => ({
      ...prev,
      fullName: prev.fullName || sessionUser.name,
      email: prev.email || sessionUser.email || '',
    }));
  }, [sessionUser]);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // After the first submit attempt, errors update live as the visitor fixes fields.
  const errors = attempted ? validateRequestForm(values, { requiresAuthorization: needsAuth }) : {};
  const summaryId = `cf-errors-${uid.replace(/:/g, '')}`;

  const set = <K extends RequestField>(key: K, value: RequestFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validateRequestForm(values, { requiresAuthorization: needsAuth });
    setAttempted(true);
    setSubmitError(null);
    if (hasErrors(found)) {
      requestAnimationFrame(() => focusControl(summaryId));
      return;
    }
    // Signed in → a real pending order in MongoDB (server validates products + quantities and derives prices).
    // The confirmation is shown ONLY after the server confirms the write (201).
    if (useSession.getState().status === 'signed-in') {
      const basket = useBasket.getState();
      if (basket.serviceIds.length === 0 && basket.packageId === null) {
        setSubmitError(t('auth.orderEmpty'));
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({
            items: basket.serviceIds.map((slug) => ({ slug, quantity: basket.quantities[slug] ?? 1 })),
            packageSlug: basket.packageId,
            requestType: values.customerType === 'individual' ? 'personal' : 'business',
            organisation: values.organisation.trim(),
            phone: normalizeDigits(values.phone.trim()),
            message: values.message.trim(),
            authorizationConfirmed: needsAuth && values.authorization,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { order?: PublicOrder; fields?: Record<string, unknown>; unknown?: unknown[] };
        if (res.status === 201 && data.order) {
          useBasket.getState().clear();
          onOrder(data.order);
          return;
        }
        if (res.status === 401) {
          useSession.getState().setUser(null);
          setSubmitError(t('auth.orderSessionExpired'));
          return;
        }
        setSubmitError(t('auth.orderFailed', { reason: t(orderErrorKey(res.status, data)) }));
      } catch {
        setSubmitError(t('auth.orderFailed', { reason: t('auth.errNetwork') }));
      } finally {
        setSubmitting(false);
      }
      return;
    }
    const result = saveRequest({
      lang,
      packageId,
      serviceIds: [...serviceIds],
      customerType: values.customerType as CustomerType,
      contactMethod: values.contactMethod,
      fullName: values.fullName.trim(),
      email: values.email.trim(),
      organisation: values.organisation.trim(),
      phone: normalizeDigits(values.phone.trim()),
      message: values.message.trim(),
      authorizationConfirmed: needsAuth && values.authorization,
    });
    onSaved(result);
  };

  const err = (field: RequestField) => errors[field];
  const errId = (field: RequestField) => (errors[field] ? `cf-${field}-error` : undefined);
  const errorText = (field: RequestField) => {
    const e = errors[field];
    return e ? <FieldErrorText id={`cf-${field}-error`}>{errorMessage(t, e)}</FieldErrorText> : null;
  };

  const fields = errorFields(errors);
  const messageLength = values.message.trim().length;

  return (
    <form className="contact-form" noValidate onSubmit={onSubmit} aria-labelledby="contact-form-title">
      <div className="contact-form__head">
        <h3 id="contact-form-title" className="contact-form__title">
          {t('contact.formTitle')}
        </h3>
        {sessionUser ? (
          <span className="badge badge--teal">{t('auth.accountBadge')}</span>
        ) : (
          <span className="badge badge--demo">{t('common.demoBadge')}</span>
        )}
      </div>
      <p className="contact-form__legend">{t('contact.requiredLegend')}</p>

      {attempted && fields.length > 0 ? (
        <ErrorSummary
          id={summaryId}
          title={t('contact.errorTitle')}
          intro={t('contact.errorIntro', { count: fields.length })}
          items={fields.map((field) => ({
            target: controlId(field),
            label: t(FIELD_LABEL[field]),
            message: errorMessage(t, errors[field]!),
          }))}
        />
      ) : null}

      <div className="contact-form__row">
        <div className="field">
          <label className="field__label" htmlFor="cf-fullName">
            {t('contact.fullName')}
            <span className="field__req" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="cf-fullName"
            className="input"
            name="name"
            autoComplete="name"
            required
            aria-required="true"
            maxLength={LIMITS.nameMax + 20}
            value={values.fullName}
            aria-invalid={err('fullName') ? true : undefined}
            aria-describedby={errId('fullName')}
            onChange={(e) => set('fullName', e.target.value)}
          />
          {errorText('fullName')}
        </div>
        <div className="field">
          <label className="field__label" htmlFor="cf-email">
            {t('contact.email')}
            <span className="field__req" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="cf-email"
            className="input"
            type="email"
            name="email"
            inputMode="email"
            autoComplete="email"
            dir="ltr"
            required
            aria-required="true"
            value={values.email}
            aria-invalid={err('email') ? true : undefined}
            aria-describedby={describedBy('cf-email-hint', errId('email'))}
            onChange={(e) => set('email', e.target.value)}
          />
          <p id="cf-email-hint" className="field__hint">
            {t('contact.emailHint')}
          </p>
          {errorText('email')}
        </div>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="cf-organisation">
          {t('contact.organisation')}
          <span className="sg-optional">({t('contact.optional')})</span>
        </label>
        <input
          id="cf-organisation"
          className="input"
          name="organization"
          autoComplete="organization"
          value={values.organisation}
          aria-invalid={err('organisation') ? true : undefined}
          aria-describedby={errId('organisation')}
          onChange={(e) => set('organisation', e.target.value)}
        />
        {errorText('organisation')}
      </div>

      <fieldset
        className="sg-fieldset"
        aria-required="true"
        aria-invalid={err('customerType') ? true : undefined}
        aria-describedby={errId('customerType')}
      >
        <legend>
          {t('contact.customerType')}
          <span className="field__req" aria-hidden="true">
            *
          </span>
        </legend>
        <div className="contact-form__choices">
          {(
            [
              ['business', 'contact.typeBusiness', 'contact.typeBusinessHint'],
              ['individual', 'contact.typeIndividual', 'contact.typeIndividualHint'],
            ] as const
          ).map(([value, label, hint]) => (
            <label key={value} className="sg-choice" htmlFor={`cf-customerType-${value}`}>
              <input
                id={`cf-customerType-${value}`}
                type="radio"
                name="customerType"
                value={value}
                checked={values.customerType === value}
                aria-describedby={errId('customerType')}
                onChange={() => set('customerType', value)}
              />
              <span className="sg-choice__mark" aria-hidden="true" />
              <span className="sg-choice__text">
                <span className="sg-choice__label">{t(label)}</span>
                <span className="sg-choice__hint">{t(hint)}</span>
              </span>
            </label>
          ))}
        </div>
        {errorText('customerType')}
      </fieldset>

      <div className="contact-form__row">
        <div className="field">
          <label className="field__label" htmlFor="cf-phone">
            {t('contact.phone')}
            {values.contactMethod === 'phone' ? (
              <span className="field__req" aria-hidden="true">
                *
              </span>
            ) : (
              <span className="sg-optional">({t('contact.optional')})</span>
            )}
          </label>
          <input
            id="cf-phone"
            className="input"
            type="tel"
            name="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            value={values.phone}
            aria-required={values.contactMethod === 'phone' ? true : undefined}
            aria-invalid={err('phone') ? true : undefined}
            aria-describedby={describedBy('cf-phone-hint', errId('phone'))}
            onChange={(e) => set('phone', e.target.value)}
          />
          <p id="cf-phone-hint" className="field__hint">
            {t('contact.phoneHint')}
          </p>
          {errorText('phone')}
        </div>

        <fieldset className="sg-fieldset" aria-describedby={errId('contactMethod')}>
          <legend>{t('contact.contactMethod')}</legend>
          <div className="segmented contact-form__segmented">
            {(
              [
                ['email', 'contact.methodEmail'],
                ['phone', 'contact.methodPhone'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="contact-seg" htmlFor={`cf-contactMethod-${value}`}>
                <input
                  id={`cf-contactMethod-${value}`}
                  type="radio"
                  name="contactMethod"
                  value={value}
                  checked={values.contactMethod === value}
                  onChange={() => set('contactMethod', value)}
                />
                <span>{t(label)}</span>
              </label>
            ))}
          </div>
          {errorText('contactMethod')}
        </fieldset>
      </div>

      <div className="field">
        <label className="field__label" htmlFor="cf-message">
          {t('contact.message')}
          <span className="field__req" aria-hidden="true">
            *
          </span>
        </label>
        <textarea
          id="cf-message"
          className="textarea"
          name="message"
          rows={5}
          required
          aria-required="true"
          value={values.message}
          aria-invalid={err('message') ? true : undefined}
          aria-describedby={describedBy('cf-message-hint', errId('message'))}
          onChange={(e) => set('message', e.target.value)}
        />
        <div className="contact-form__msgmeta">
          <p id="cf-message-hint" className="field__hint">
            {t('contact.messageHint', { min: LIMITS.messageMin })}
          </p>
          <span
            className="telemetry contact-form__count"
            data-ok={messageLength >= LIMITS.messageMin || undefined}
            aria-hidden="true"
          >
            {t('contact.messageCount', { count: messageLength, max: LIMITS.messageMax })}
          </span>
        </div>
        {errorText('message')}
      </div>

      {needsAuth ? (
        <div className="contact-form__auth" data-invalid={err('authorization') ? true : undefined}>
          <label className="check" htmlFor="cf-authorization">
            <input
              id="cf-authorization"
              type="checkbox"
              checked={values.authorization}
              required
              aria-required="true"
              aria-invalid={err('authorization') ? true : undefined}
              aria-describedby={describedBy('cf-authorization-hint', errId('authorization'))}
              onChange={(e) => set('authorization', e.target.checked)}
            />
            <span>
              <ShieldAlert aria-hidden="true" className="contact-form__auth-icon" />
              {t('contact.authorization')}
              <span className="field__req" aria-hidden="true">
                *
              </span>
            </span>
          </label>
          <p id="cf-authorization-hint" className="field__hint">
            {t('contact.authorizationHint')}
          </p>
          {errorText('authorization')}
        </div>
      ) : null}

      <div className="contact-form__ack" data-invalid={err('acknowledge') ? true : undefined}>
        <label className="check" htmlFor="cf-acknowledge">
          <input
            id="cf-acknowledge"
            type="checkbox"
            checked={values.acknowledge}
            required
            aria-required="true"
            aria-invalid={err('acknowledge') ? true : undefined}
            aria-describedby={errId('acknowledge')}
            onChange={(e) => set('acknowledge', e.target.checked)}
          />
          <span>
            {sessionUser ? t('auth.orderAcknowledge') : t('contact.acknowledge')}
            <span className="field__req" aria-hidden="true">
              *
            </span>
          </span>
        </label>
        {errorText('acknowledge')}
      </div>

      {sessionUser ? (
        <p className="contact-account" data-testid="order-account-note">
          <CheckCircle2 aria-hidden="true" />
          <span>
            {t('auth.signedInAs', { name: sessionUser.name })} · <Link href="/orders">{t('auth.myOrders')}</Link>
          </span>
        </p>
      ) : (
        <div className="contact-account contact-account--out" data-testid="order-login-hint">
          <LogIn aria-hidden="true" />
          <span>
            {t('auth.orderLoginHint')}{' '}
            <Link href={`/login?next=${encodeURIComponent('/#contact')}`}>{t('auth.orderLoginCta')}</Link>
            {' · '}
            <Link href={`/signup?next=${encodeURIComponent('/#contact')}`}>{t('auth.orderSignupCta')}</Link>
          </span>
        </div>
      )}

      {submitError ? (
        <p className="contact-order-error" role="alert" data-testid="order-error">
          {submitError}
        </p>
      ) : null}

      <div className="contact-form__submit">
        <button type="submit" className="btn btn--primary btn--lg" disabled={submitting} aria-busy={submitting}>
          {submitting ? t('auth.orderBusy') : sessionUser ? t('auth.placeOrder') : t('contact.submit')}
          <ArrowRight aria-hidden="true" className="icon-flip" />
        </button>
        <p className="field__hint">{sessionUser ? t('auth.placeOrderNote') : t('contact.submitNote')}</p>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------------------------
/** Shown only after POST /api/orders returned 201 (the order is stored in MongoDB). */
function OrderConfirmation({ order, onNew }: { order: PublicOrder; onNew: () => void }) {
  const { t, lang } = useI18n();
  const code = `SG-${order.id.slice(-6).toUpperCase()}`;
  useEffect(() => {
    requestAnimationFrame(() => focusControl('contact-done'));
  }, []);
  return (
    <div id="contact-done" className="contact-done" role="region" tabIndex={-1} aria-labelledby="contact-done-title" data-testid="order-confirmation">
      <div className="contact-done__top">
        <span className="contact-done__seal" aria-hidden="true">
          <CheckCircle2 />
        </span>
      </div>
      <h3 id="contact-done-title" className="contact-done__title">
        {t('auth.orderSavedTitle')}
      </h3>
      <p className="contact-done__note">{t('auth.orderSavedBody', { id: code })}</p>
      <div className="contact-done__items">
        <p className="contact-done__label">{t('auth.orderItems')}</p>
        <ul className="contact-req__list">
          {order.items.map((item) => (
            <li key={item.slug} className="contact-req__item">
              {(lang === 'ar' && item.name.ar) || item.name.en} × {item.quantity}
            </li>
          ))}
        </ul>
      </div>
      <div className="contact-done__actions">
        <Link className="btn btn--primary btn--sm" href={`/orders/${order.id}`}>
          {t('auth.orderSavedLink')}
        </Link>
        <button type="button" className="btn btn--secondary btn--sm" onClick={onNew}>
          <RotateCcw aria-hidden="true" />
          {t('auth.orderNew')}
        </button>
      </div>
    </div>
  );
}

function Confirmation({ result, onNew }: { result: SaveResult<DemoRequestRecord>; onNew: () => void }) {
  const { t, loc } = useI18n();
  const { record, persisted } = result;

  useEffect(() => {
    requestAnimationFrame(() => focusControl('contact-done'));
  }, []);

  const clearBasket = () => {
    const state = useBasket.getState();
    const ui = useUI.getState();
    if (state.serviceIds.length === 0 && state.packageId === null) {
      ui.toast({ tone: 'info', message: t('contact.basketAlreadyEmpty') });
      return;
    }
    const before: BasketSnapshot = { serviceIds: [...state.serviceIds], packageId: state.packageId, quantities: { ...state.quantities } };
    state.clear();
    ui.toast({
      tone: 'info',
      message: t('contact.basketCleared'),
      action: { label: t('common.undo'), run: () => useBasket.getState().restore(before) },
    });
  };

  const clearData = () => {
    clearDemoData();
    useUI.getState().toast({ tone: 'info', message: t('contact.dataCleared') });
  };

  const pkg = record.packageId ? getPackage(record.packageId) : null;
  const typeLabel = record.customerType === 'business' ? t('contact.typeBusiness') : t('contact.typeIndividual');
  const methodLabel = record.contactMethod === 'email' ? t('contact.methodEmail') : t('contact.methodPhone');

  return (
    <div id="contact-done" className="contact-done" tabIndex={-1} aria-labelledby="contact-done-title">
      <div className="contact-done__top">
        <span className="contact-done__seal" data-failed={!persisted || undefined} aria-hidden="true">
          {persisted ? <CheckCircle2 /> : <ShieldAlert />}
        </span>
        <span className="badge badge--demo">{t('common.demoBadge')}</span>
      </div>
      <h3 id="contact-done-title" className="contact-done__title">
        {persisted ? t('contact.successTitle') : t('contact.failedTitle')}
      </h3>
      <p className="contact-done__note">{persisted ? t('contact.successNote') : t('contact.saveFailed')}</p>

      <dl className="contact-done__ref">
        <dt>{t('contact.reference')}</dt>
        <dd>
          <code>{record.reference}</code>
        </dd>
      </dl>

      <div className="contact-done__items">
        <p className="contact-done__label">{t('contact.savedItems')}</p>
        {pkg || record.serviceIds.length > 0 ? (
          <ul className="contact-req__list">
            {pkg ? (
              <li className="contact-req__item contact-req__item--pkg">
                <PackageCheck aria-hidden="true" />
                <span>
                  <span className="contact-req__tag">{t('contact.packageTag')}</span> {loc(pkg.name)}
                </span>
              </li>
            ) : null}
            {record.serviceIds.map((id) => {
              const s = getService(id);
              return (
                <li key={id} className="contact-req__item">
                  <ServiceIcon name={s.icon} />
                  <span>{loc(s.name)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="muted">{t('contact.savedGeneral')}</p>
        )}
        <p className="contact-done__meta">{t('contact.savedAs', { type: typeLabel, method: methodLabel })}</p>
      </div>

      <div className="contact-done__actions">
        <button type="button" className="btn btn--primary" onClick={onNew}>
          <RotateCcw aria-hidden="true" />
          {t('contact.newRequest')}
        </button>
        <button type="button" className="btn btn--secondary" onClick={clearBasket}>
          <Trash2 aria-hidden="true" />
          {t('contact.clearBasket')}
        </button>
        <button type="button" className="btn btn--ghost btn--sm contact-done__wipe" onClick={clearData}>
          <Eraser aria-hidden="true" />
          {t('contact.clearData')}
        </button>
      </div>
    </div>
  );
}
