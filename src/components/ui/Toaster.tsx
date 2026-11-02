// Polite live region for feedback toasts (add/remove/package changes). Auto-dismiss pauses on hover/focus.
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { useUI, type Toast } from '../../state/ui';
import { useI18n } from '../../i18n';
import './Toaster.css';

const ICON = { success: CheckCircle2, info: Info, warning: TriangleAlert } as const;

function ToastItem({ toast }: { toast: Toast }) {
  const dismiss = useUI((s) => s.dismissToast);
  const { t } = useI18n();
  const [paused, setPaused] = useState(false);
  const timer = useRef(0);
  useEffect(() => {
    if (paused) return;
    timer.current = window.setTimeout(() => dismiss(toast.id), 5200);
    return () => window.clearTimeout(timer.current);
  }, [paused, dismiss, toast.id]);
  const Icon = ICON[toast.tone];
  return (
    <li
      className={`sg-toast sg-toast--${toast.tone}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <Icon className="sg-toast__icon" aria-hidden="true" />
      <p className="sg-toast__msg">{toast.message}</p>
      {toast.action ? (
        <button
          type="button"
          className="btn btn--ghost btn--sm sg-toast__action"
          onClick={() => {
            toast.action?.run();
            dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      ) : null}
      <button type="button" className="btn btn--ghost btn--icon btn--sm" aria-label={t('common.dismiss')} onClick={() => dismiss(toast.id)}>
        <X aria-hidden="true" />
      </button>
    </li>
  );
}

export function Toaster() {
  const toasts = useUI((s) => s.toasts);
  const { t } = useI18n();
  return (
    <section className="sg-toaster" aria-label={t('common.notifications')}>
      <ol role="status" aria-live="polite" aria-relevant="additions text">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </ol>
    </section>
  );
}
