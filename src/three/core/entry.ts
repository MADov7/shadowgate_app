// Entrance choreography helpers — every gate/camera/particle state is a pure function of scrollState.entry
// (0 = standing outside the closed gate, 1 = arrived in the hero pose), so the entrance is scrubbable and
// reversible (e.g. ?entry=0.3 for QA screenshots).
import { clamp01, easeInOutCubic, range, smoothstep } from '../../lib/choreo';
import { ENTRY_PHASES } from '../worldLayout';

const [TRACE_A, TRACE_B] = ENTRY_PHASES.trace;
const [OPEN_A, OPEN_B] = ENTRY_PHASES.open;
const [FLY_A, FLY_B] = ENTRY_PHASES.fly;
const TRACE_SPAN = TRACE_B - TRACE_A;

/** Light-trace progress for the three line groups (base → frame → door seam + S path), each 0..1. */
export function traceStages(entry: number): { base: number; frame: number; doors: number } {
  const e = clamp01(entry);
  return {
    base: range(TRACE_A, TRACE_A + TRACE_SPAN * 0.3, e),
    frame: range(TRACE_A + TRACE_SPAN * 0.12, TRACE_A + TRACE_SPAN * 0.86, e),
    doors: range(TRACE_A + TRACE_SPAN * 0.55, TRACE_B, e),
  };
}

/** Door leaves: 0 closed → 1 fully open (eased: heavy start, soft landing). */
export function doorOpen(entry: number): number {
  const u = range(OPEN_A, OPEN_B, entry);
  // Slow unlatch, then a heavy, damped swing.
  return easeInOutCubic(u) * 0.92 + smoothstep(0, 0.25, u) * 0.08;
}

/** Camera fly-through progress (eased) 0..1. */
export function flyProgress(entry: number): number {
  return easeInOutCubic(range(FLY_A, FLY_B, entry));
}

/** Raw (linear) fly phase 0..1 — particles stagger on this. */
export function flyPhase(entry: number): number {
  return range(FLY_A, FLY_B, entry);
}

/** How much light pours out of the opening: a seam leak while closed, flooding as the leaves swing. */
export function gateLight(entry: number): number {
  const open = doorOpen(entry);
  return 0.12 + 0.88 * open;
}
