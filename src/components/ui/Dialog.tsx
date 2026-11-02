// Accessible modal / drawer built on the native <dialog> element:
// showModal() makes the page inert (focus stays inside), Escape closes, focus returns to the opener.
import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { X } from 'lucide-react';
import { lockScroll } from '../../lib/smoothScroll';
import { useI18n } from '../../i18n';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the dialog (usually its h2). */
  labelledBy: string;
  describedBy?: string;
  variant?: 'modal' | 'drawer';
  className?: string;
  /** Element to focus when opening (defaults to the first focusable element). */
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

export function Dialog({ open, onClose, labelledBy, describedBy, variant = 'modal', className, initialFocus, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      lockScroll(true);
      requestAnimationFrame(() => initialFocus?.current?.focus());
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocus]);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (event: Event) => {
      event.preventDefault(); // keep React state as the source of truth
      onCloseRef.current();
    };
    const onNativeClose = () => {
      lockScroll(false);
      const target = returnTo.current;
      returnTo.current = null;
      if (target && document.contains(target)) target.focus({ preventScroll: true });
    };
    dialog.addEventListener('cancel', onCancel);
    dialog.addEventListener('close', onNativeClose);
    return () => {
      dialog.removeEventListener('cancel', onCancel);
      dialog.removeEventListener('close', onNativeClose);
      if (dialog.open) {
        dialog.close();
        lockScroll(false);
      }
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`sg-dialog${variant === 'drawer' ? ' sg-dialog--drawer' : ''}${className ? ` ${className}` : ''}`}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      data-lenis-prevent
      onClick={(event) => {
        // Clicks on the ::backdrop land on the <dialog> element itself.
        if (event.target === ref.current) onCloseRef.current();
      }}
    >
      {open ? children : null}
    </dialog>
  );
}

/** Standard close button for dialog headers. */
export function DialogClose({ onClick }: { onClick: () => void }) {
  const { t } = useI18n();
  return (
    <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={onClick} aria-label={t('common.close')}>
      <X aria-hidden="true" />
    </button>
  );
}
