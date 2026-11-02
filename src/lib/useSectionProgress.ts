// Section-local scroll progress for DOM choreography (text reveals, step changes).
// Uses ScrollTrigger in scrub-style measurement; reversible by construction.
import { useEffect, useRef, useState, type RefObject } from 'react';
import { ScrollTrigger } from './smoothScroll';

interface Options {
  /** ScrollTrigger start, default 'top top' (sticky sections). */
  start?: string;
  /** ScrollTrigger end, default 'bottom bottom' (sticky sections). */
  end?: string;
  enabled?: boolean;
}

/** Calls `onProgress(p)` (0..1) on every scroll update without re-rendering React. */
export function useSectionProgress(
  ref: RefObject<HTMLElement | null>,
  onProgress: (progress: number) => void,
  { start = 'top top', end = 'bottom bottom', enabled = true }: Options = {},
): void {
  const cb = useRef(onProgress);
  cb.current = onProgress;
  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    const st = ScrollTrigger.create({
      trigger: el,
      start,
      end,
      onUpdate: (self) => cb.current(self.progress),
      onRefresh: (self) => cb.current(self.progress),
    });
    cb.current(st.progress);
    return () => st.kill();
  }, [ref, start, end, enabled]);
}

/**
 * React state that only changes when the derived step changes (e.g. active layer index),
 * so components re-render a handful of times per section instead of every frame.
 */
export function useSectionStep(
  ref: RefObject<HTMLElement | null>,
  toStep: (progress: number) => number,
  options?: Options,
): number {
  const [step, setStep] = useState(() => toStep(0));
  const toStepRef = useRef(toStep);
  toStepRef.current = toStep;
  useSectionProgress(
    ref,
    (p) => {
      const next = toStepRef.current(p);
      setStep((prev) => (prev === next ? prev : next));
    },
    options,
  );
  return step;
}
