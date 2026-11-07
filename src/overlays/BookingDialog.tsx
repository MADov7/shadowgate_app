// Demo booking dialog for personal services (opened with useUI.openBooking(id); mounted once in App).
// Day + time are radio groups generated locally from today's date — no real calendar or availability exists.
// Saving writes to localStorage only and says so: "Demo booking saved in this browser. No booking has been made."
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, CalendarCheck, FlaskConical, MapPin, RotateCcw, Video } from 'lucide-react';
import { Dialog, DialogClose } from '../components/ui/Dialog';
import { useI18n, type TKey } from '../i18n';
import { useUI } from '../state/ui';
import { getService, servicesFor } from '../data/services';
import type { PersonalServiceId, ServiceId } from '../data/types';
import {
  BOOKING_TIMES,
  formatDayParts,
  formatSlot,
  illustrativeParts,
  saveBooking,
  upcomingWeekdays,
  type DemoBookingRecord,
  type SaveResult,
} from '../lib/requests';
import {
  LIMITS,
  errorFields,
  hasErrors,
  validateBookingForm,
  type BookingField,
  type BookingFormValues,
  type SessionFormat,
} from '../lib/validation';
import { ErrorSummary, FieldErrorText, describedBy, errorMessage, focusControl } from '../sections/Contact/FormParts';
import './BookingDialog.css';

export function BookingDialog() {
  const bookingId = useUI((s) => s.bookingId);
  const close = () => useUI.getState().closeBooking();
  return (
    <Dialog open={bookingId !== null} onClose={close} labelledBy="bk-title" describedBy="bk-intro" className="bk-dialog">
      {bookingId ? <BookingFlow initialService={bookingId} onClose={close} /> : null}
    </Dialog>
  );
}

const FIELD_LABEL: Record<BookingField, TKey> = {
  serviceId: 'booking.service',
  date: 'booking.date',
  time: 'booking.time',
  format: 'booking.format',
  name: 'booking.name',
  email: 'booking.email',
  notes: 'booking.notes',
};

const FORMATS: ReadonlyArray<{ value: SessionFormat; label: TKey; hint: TKey; icon: typeof Video }> = [
  { value: 'online', label: 'booking.formatOnline', hint: 'booking.formatOnlineHint', icon: Video },
  { value: 'in-person', label: 'booking.formatInPerson', hint: 'booking.formatInPersonHint', icon: MapPin },
];

function emptyValues(serviceId: string): BookingFormValues {
  return { serviceId, date: '', time: '', format: '', name: '', email: '', notes: '' };
}

function BookingFlow({ initialService, onClose }: { initialService: ServiceId; onClose: () => void }) {
  const { t, loc, lang } = useI18n();
  const personal = useMemo(() => servicesFor('personal'), []);
  const serviceIds = useMemo(() => personal.map((s) => s.id as string), [personal]);
  // Generated once per opening from today's date (today itself is never offered).
  const dates = useMemo(() => upcomingWeekdays(new Date()), []);
  const prefill = serviceIds.includes(initialService) ? initialService : '';
  const [values, setValues] = useState<BookingFormValues>(() => emptyValues(prefill));
  const [attempted, setAttempted] = useState(false);
  const [saved, setSaved] = useState<SaveResult<DemoBookingRecord> | null>(null);

  const ctx = { serviceIds, dates, times: BOOKING_TIMES };
  const errors = attempted ? validateBookingForm(values, ctx) : {};
  const fields = errorFields(errors);

  const set = <K extends BookingField>(key: K, value: BookingFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  const controlId = (field: BookingField) => {
    if (field === 'date') return `bk-date-${values.date || dates[0]}`;
    if (field === 'time') return `bk-time-${(values.time || BOOKING_TIMES[0]).replace(':', '')}`;
    if (field === 'format') return `bk-format-${values.format || 'online'}`;
    return `bk-${field}`;
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (hasErrors(validateBookingForm(values, ctx))) {
      requestAnimationFrame(() => focusControl('bk-errors'));
      return;
    }
    setSaved(
      saveBooking({
        lang,
        serviceId: values.serviceId as PersonalServiceId,
        date: values.date,
        time: values.time,
        format: values.format as SessionFormat,
        name: values.name.trim(),
        email: values.email.trim(),
        notes: values.notes.trim(),
      }),
    );
  };

  if (saved) {
    return (
      <BookingConfirmation
        result={saved}
        onClose={onClose}
        onAnother={() => {
          setSaved(null);
          setAttempted(false);
          setValues(emptyValues(saved.record.serviceId));
        }}
      />
    );
  }

  const errId = (field: BookingField) => (errors[field] ? `bk-${field}-error` : undefined);
  const errorText = (field: BookingField) => {
    const e = errors[field];
    return e ? <FieldErrorText id={`bk-${field}-error`}>{errorMessage(t, e)}</FieldErrorText> : null;
  };
  const selected = values.serviceId ? getService(values.serviceId as ServiceId) : null;
  const price = selected ? illustrativeParts(selected.pricing, lang) : null;

  return (
    <>
      <header className="sg-dialog__head bk-head">
        <div className="bk-head__text">
          <span className="badge badge--demo">
            <FlaskConical aria-hidden="true" />
            {t('booking.badge')}
          </span>
          <h2 id="bk-title" className="bk-head__title">
            {t('booking.title')}
          </h2>
          <p id="bk-intro" className="bk-head__intro">
            {t('booking.intro')}
          </p>
        </div>
        <DialogClose onClick={onClose} />
      </header>

      <div className="sg-dialog__body">
        <form id="bk-form" className="bk-form" noValidate onSubmit={onSubmit}>
          {attempted && fields.length > 0 ? (
            <ErrorSummary
              id="bk-errors"
              title={t('booking.errorTitle')}
              intro={t('booking.errorIntro', { count: fields.length })}
              items={fields.map((field) => ({
                target: controlId(field),
                label: t(FIELD_LABEL[field]),
                message: errorMessage(t, errors[field]!),
              }))}
            />
          ) : null}

          <div className="field">
            <label className="field__label" htmlFor="bk-serviceId">
              {t('booking.service')}
              <span className="field__req" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="bk-serviceId"
              className="select"
              value={values.serviceId}
              required
              aria-required="true"
              aria-invalid={errors.serviceId ? true : undefined}
              aria-describedby={describedBy(selected && 'bk-service-meta', errId('serviceId'))}
              onChange={(e) => set('serviceId', e.target.value)}
            >
              {prefill === '' ? <option value="">—</option> : null}
              {personal.map((s) => (
                <option key={s.id} value={s.id}>
                  {loc(s.name)}
                </option>
              ))}
            </select>
            {selected ? (
              <p id="bk-service-meta" className="field__hint bk-service-meta">
                {t('booking.serviceMeta', {
                  duration: loc(selected.duration),
                  price: price
                    ? `${t('common.illustrativePrice')} · ${t('common.priceFrom', price)}`
                    : t('common.quoteBased'),
                })}
              </p>
            ) : null}
            {errorText('serviceId')}
          </div>

          <fieldset
            className="sg-fieldset"
            aria-required="true"
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={describedBy('bk-date-hint', errId('date'))}
          >
            <legend>
              {t('booking.date')}
              <span className="field__req" aria-hidden="true">
                *
              </span>
              <span id="bk-date-hint" className="sg-legend-hint">
                {t('booking.dateHint')}
              </span>
            </legend>
            <div className="bk-days">
              {dates.map((iso) => {
                const d = formatDayParts(iso, lang);
                return (
                  <label key={iso} className="bk-day" htmlFor={`bk-date-${iso}`}>
                    <input
                      id={`bk-date-${iso}`}
                      type="radio"
                      name="bk-date"
                      value={iso}
                      checked={values.date === iso}
                      aria-label={d.full}
                      onChange={() => set('date', iso)}
                    />
                    <span className="bk-day__wd" aria-hidden="true">
                      {d.weekday}
                    </span>
                    <span className="bk-day__num" aria-hidden="true">
                      {d.day}
                    </span>
                    <span className="bk-day__mo" aria-hidden="true">
                      {d.month}
                    </span>
                  </label>
                );
              })}
            </div>
            {errorText('date')}
          </fieldset>

          <fieldset
            className="sg-fieldset"
            aria-required="true"
            aria-invalid={errors.time ? true : undefined}
            aria-describedby={describedBy('bk-time-hint', errId('time'))}
          >
            <legend>
              {t('booking.time')}
              <span className="field__req" aria-hidden="true">
                *
              </span>
              <span id="bk-time-hint" className="sg-legend-hint">
                {t('booking.timeHint')}
              </span>
            </legend>
            <div className="bk-times">
              {BOOKING_TIMES.map((time) => {
                const id = `bk-time-${time.replace(':', '')}`;
                return (
                  <label key={time} className="bk-time" htmlFor={id}>
                    <input
                      id={id}
                      type="radio"
                      name="bk-time"
                      value={time}
                      checked={values.time === time}
                      onChange={() => set('time', time)}
                    />
                    <span>{formatSlot(time, lang)}</span>
                  </label>
                );
              })}
            </div>
            {errorText('time')}
          </fieldset>

          <fieldset
            className="sg-fieldset"
            aria-required="true"
            aria-invalid={errors.format ? true : undefined}
            aria-describedby={errId('format')}
          >
            <legend>
              {t('booking.format')}
              <span className="field__req" aria-hidden="true">
                *
              </span>
            </legend>
            <div className="bk-formats">
              {FORMATS.map(({ value, label, hint, icon: Icon }) => (
                <label key={value} className="sg-choice" htmlFor={`bk-format-${value}`}>
                  <input
                    id={`bk-format-${value}`}
                    type="radio"
                    name="bk-format"
                    value={value}
                    checked={values.format === value}
                    onChange={() => set('format', value)}
                  />
                  <span className="sg-choice__mark" aria-hidden="true" />
                  <Icon aria-hidden="true" className="bk-format__icon" />
                  <span className="sg-choice__text">
                    <span className="sg-choice__label">{t(label)}</span>
                    <span className="sg-choice__hint">{t(hint)}</span>
                  </span>
                </label>
              ))}
            </div>
            {errorText('format')}
          </fieldset>

          <div className="bk-row">
            <div className="field">
              <label className="field__label" htmlFor="bk-name">
                {t('booking.name')}
                <span className="field__req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="bk-name"
                className="input"
                autoComplete="name"
                required
                aria-required="true"
                value={values.name}
                aria-invalid={errors.name ? true : undefined}
                aria-describedby={errId('name')}
                onChange={(e) => set('name', e.target.value)}
              />
              {errorText('name')}
            </div>
            <div className="field">
              <label className="field__label" htmlFor="bk-email">
                {t('booking.email')}
                <span className="field__req" aria-hidden="true">
                  *
                </span>
              </label>
              <input
                id="bk-email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="email"
                dir="ltr"
                required
                aria-required="true"
                value={values.email}
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={errId('email')}
                onChange={(e) => set('email', e.target.value)}
              />
              {errorText('email')}
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="bk-notes">
              {t('booking.notes')}
              <span className="sg-optional">({t('booking.optional')})</span>
            </label>
            <textarea
              id="bk-notes"
              className="textarea bk-notes"
              rows={3}
              maxLength={LIMITS.notesMax + 50}
              value={values.notes}
              aria-invalid={errors.notes ? true : undefined}
              aria-describedby={describedBy('bk-notes-hint', errId('notes'))}
              onChange={(e) => set('notes', e.target.value)}
            />
            <p id="bk-notes-hint" className="field__hint">
              {t('booking.notesHint')}
            </p>
            {errorText('notes')}
          </div>
        </form>
      </div>

      <footer className="sg-dialog__foot">
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          {t('common.cancel')}
        </button>
        <button type="submit" form="bk-form" className="btn btn--primary">
          <CalendarCheck aria-hidden="true" />
          {t('booking.submit')}
        </button>
      </footer>
    </>
  );
}

function BookingConfirmation({
  result,
  onClose,
  onAnother,
}: {
  result: SaveResult<DemoBookingRecord>;
  onClose: () => void;
  onAnother: () => void;
}) {
  const { t, loc, lang } = useI18n();
  const { record, persisted } = result;
  const service = getService(record.serviceId);
  const day = formatDayParts(record.date, lang);

  useEffect(() => {
    requestAnimationFrame(() => document.getElementById('bk-done')?.focus());
  }, []);

  return (
    <>
      <header className="sg-dialog__head bk-head">
        <div className="bk-head__text">
          <span className="badge badge--demo">
            <FlaskConical aria-hidden="true" />
            {t('booking.badge')}
          </span>
          <h2 id="bk-title" className="bk-head__title">
            {persisted ? t('booking.successTitle') : t('booking.failedTitle')}
          </h2>
        </div>
        <DialogClose onClick={onClose} />
      </header>

      <div className="sg-dialog__body">
        <div id="bk-done" className="bk-done" tabIndex={-1}>
          <p id="bk-intro" className="bk-done__note" data-failed={!persisted || undefined}>
            {persisted ? t('booking.successNote') : t('booking.saveFailed')}
          </p>

          <div className="bk-ticket">
            <div className="bk-ticket__main">
              <span className="telemetry" aria-hidden="true">
                SG//DEMO BOOKING
              </span>
              <dl className="bk-ticket__rows">
                <div>
                  <dt>{t('booking.summaryService')}</dt>
                  <dd>{loc(service.name)}</dd>
                </div>
                <div>
                  <dt>{t('booking.summaryWhen')}</dt>
                  <dd>{t('booking.summaryWhenValue', { date: day.full, time: formatSlot(record.time, lang) })}</dd>
                </div>
                <div>
                  <dt>{t('booking.summaryFormat')}</dt>
                  <dd>{record.format === 'online' ? t('booking.formatOnline') : t('booking.formatInPerson')}</dd>
                </div>
                <div>
                  <dt>{t('booking.summaryName')}</dt>
                  <dd>{record.name}</dd>
                </div>
              </dl>
            </div>
            <div className="bk-ticket__stub">
              <span className="bk-ticket__stamp" aria-hidden="true">
                {t('booking.stamp')}
              </span>
              <span className="bk-ticket__reflabel">{t('booking.reference')}</span>
              <code className="bk-ticket__ref">{record.reference}</code>
            </div>
          </div>
        </div>
      </div>

      <footer className="sg-dialog__foot">
        <button type="button" className="btn btn--secondary" onClick={onAnother}>
          <RotateCcw aria-hidden="true" />
          {t('booking.another')}
        </button>
        <button type="button" className="btn btn--primary" onClick={onClose}>
          {t('booking.done')}
          <ArrowRight aria-hidden="true" className="icon-flip" />
        </button>
      </footer>
    </>
  );
}
