// Original SHADOW GATE mark: a chamfered gateway frame with an angular "S" path running through it —
// the S is the guided route through the gate. Two strokes only, so it stays legible at 16px.
import type { SVGProps } from 'react';

export const MARK_FRAME = 'M12 58V21L24.5 8.5h15L52 21v37';
export const MARK_S = 'M41 22.5H24.5v12h15v12H23';

interface MarkProps extends SVGProps<SVGSVGElement> {
  title?: string;
  /** Stroke colour of the gateway frame (defaults to soft white). */
  frameColor?: string;
  /** Stroke colour of the S path (defaults to electric teal). */
  pathColor?: string;
}

export function LogoMark({ title, frameColor = 'var(--sg-white)', pathColor = 'var(--sg-teal)', ...rest }: MarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <path d={MARK_FRAME} stroke={frameColor} strokeWidth="5" strokeLinejoin="miter" strokeLinecap="square" />
      <path d={MARK_S} stroke={pathColor} strokeWidth="5" strokeLinejoin="miter" strokeLinecap="square" />
    </svg>
  );
}

interface LockupProps {
  className?: string;
  /** Accessible name; when omitted the lockup is decorative. */
  label?: string;
  compact?: boolean;
}

/** Horizontal lockup: mark + wordmark (HTML text so it inherits the loaded brand font). */
export function LogoLockup({ className, label, compact }: LockupProps) {
  return (
    <span className={`sg-lockup${compact ? ' sg-lockup--compact' : ''}${className ? ` ${className}` : ''}`} aria-label={label} role={label ? 'img' : undefined}>
      <LogoMark className="sg-lockup__mark" />
      <span className="sg-lockup__word" aria-hidden="true">
        SHADOW<span className="sg-lockup__gate">GATE</span>
      </span>
    </span>
  );
}
