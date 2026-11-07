// Shared form building blocks for the request form and the booking dialog:
// localized error messages, an accessible error summary (links move focus to fields) and field messages.
import type { ReactNode, Ref } from 'react';
import { AlertCircle } from 'lucide-react';
import type { FieldError } from '../../lib/validation';
import { getLenis } from '../../lib/smoothScroll';
import type { TKey, TVars } from '../../i18n';
import './FormParts.css';

type Translate = (key: TKey, vars?: TVars) => string;

export function errorMessage(t: Translate, error: FieldError): string {
  switch (error.code) {
    case 'required':
      return t('contact.errRequired');
    case 'tooShort':
      return t('contact.errTooShort', { min: error.limit ?? 0 });
    case 'tooLong':
      return t('contact.errTooLong', { max: error.limit ?? 0 });
    case 'email':
      return t('contact.errEmail');
    case 'phone':
      return t('contact.errPhone');
    case 'phoneRequired':
      return t('contact.errPhoneRequired');
    case 'choice':
      return t('contact.errChoice');
    case 'authorization':
      return t('contact.errAuthorization');
    case 'acknowledge':
      return t('contact.errAcknowledge');
  }
}

/** Focuses a form control and brings it into view (inside a dialog body or on the smooth-scrolled page). */
export function focusControl(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus({ preventScroll: true });
  const reduced = document.documentElement.dataset.motion === 'reduced';
  const lenis = getLenis();
  if (lenis && !el.closest('dialog')) lenis.scrollTo(el, { offset: -180, immediate: reduced, force: true });
  else el.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
}

export interface SummaryItem {
  /** id of the control to focus. */
  target: string;
  label: string;
  message: string;
}

interface ErrorSummaryProps {
  id: string;
  title: string;
  intro: string;
  items: SummaryItem[];
  ref?: Ref<HTMLDivElement>;
}

export function ErrorSummary({ id, title, intro, items, ref }: ErrorSummaryProps) {
  return (
    <div ref={ref} id={id} className="sg-errsum" role="alert" tabIndex={-1} aria-labelledby={`${id}-title`}>
      <AlertCircle aria-hidden="true" className="sg-errsum__icon" />
      <div className="sg-errsum__content">
        <p id={`${id}-title`} className="sg-errsum__title">
          {title}
        </p>
        <p className="sg-errsum__intro">{intro}</p>
        <ul className="sg-errsum__list">
          {items.map((item) => (
            <li key={item.target}>
              <a
                href={`#${item.target}`}
                onClick={(event) => {
                  event.preventDefault();
                  focusControl(item.target);
                }}
              >
                <strong>{item.label}</strong> — {item.message}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function FieldErrorText({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="field__error">
      <AlertCircle aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

/** Builds aria-describedby from optional hint/error ids. */
export function describedBy(...ids: Array<string | false | null | undefined>): string | undefined {
  const list = ids.filter(Boolean).join(' ');
  return list || undefined;
}
