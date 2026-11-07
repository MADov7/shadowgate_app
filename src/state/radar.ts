// Simulated threat radar state — the single source of truth that keeps globe, graph and feed synchronized.
// EVERYTHING here is locally generated demo data. It is NOT real threat intelligence.
import { create } from 'zustand';

export type ThreatCategory = 'phishing' | 'login' | 'scanning' | 'traffic';
export type Severity = 'low' | 'medium' | 'high';
/** Simulated outcome of the conceptual defense, for storytelling only. */
export type Outcome = 'blocked' | 'flagged' | 'observed';

export const THREAT_CATEGORIES: readonly ThreatCategory[] = ['phishing', 'login', 'scanning', 'traffic'];

/** CSS colour tokens per category (mirrored as hex in src/brand/brand.ts for WebGL). */
export const CATEGORY_COLOR_VAR: Record<ThreatCategory, string> = {
  phishing: 'var(--sg-phishing)',
  login: 'var(--sg-login)',
  scanning: 'var(--sg-scanning)',
  traffic: 'var(--sg-traffic)',
};

export interface ThreatEvent {
  id: string;
  /** Monotonic sequence number. */
  seq: number;
  /** Simulated timestamp (ms since epoch). */
  t: number;
  category: ThreatCategory;
  severity: Severity;
  /** Illustrative region id (src/lib/geo.ts REGIONS) — never attribution. */
  from: string;
  /** Usually HOME_REGION.id (the illustrative demo network). */
  to: string;
  outcome: Outcome;
  /** Index into the per-category description variants in the radar i18n namespace. */
  variant: number;
}

export interface RadarState {
  /** Newest first, capped at MAX_EVENTS. */
  events: ThreatEvent[];
  filters: Record<ThreatCategory, boolean>;
  paused: boolean;
  selectedId: string | null;
  /** Count of simulated events per category since the page loaded. */
  totals: Record<ThreatCategory, number>;
  /** Append newly generated events (oldest → newest order). */
  pushEvents: (events: ThreatEvent[]) => void;
  toggleFilter: (category: ThreatCategory) => void;
  setAllFilters: (on: boolean) => void;
  setPaused: (paused: boolean) => void;
  select: (id: string | null) => void;
}

export const MAX_EVENTS = 160;

const zero = (): Record<ThreatCategory, number> => ({ phishing: 0, login: 0, scanning: 0, traffic: 0 });

export const useRadar = create<RadarState>((set, get) => ({
  events: [],
  filters: { phishing: true, login: true, scanning: true, traffic: true },
  paused: false,
  selectedId: null,
  totals: zero(),
  pushEvents: (incoming) => {
    if (incoming.length === 0) return;
    const totals = { ...get().totals };
    for (const e of incoming) totals[e.category] += 1;
    const events = [...incoming.slice().reverse(), ...get().events].slice(0, MAX_EVENTS);
    const selectedId = get().selectedId;
    // Keep the selection valid if the selected event fell out of the buffer.
    const stillThere = selectedId === null || events.some((e) => e.id === selectedId);
    set({ events, totals, selectedId: stillThere ? selectedId : null });
  },
  toggleFilter: (category) => {
    const filters = { ...get().filters, [category]: !get().filters[category] };
    const selected = get().events.find((e) => e.id === get().selectedId);
    set({ filters, selectedId: selected && !filters[selected.category] ? null : get().selectedId });
  },
  setAllFilters: (on) => set({ filters: { phishing: on, login: on, scanning: on, traffic: on } }),
  setPaused: (paused) => set({ paused }),
  select: (id) => set({ selectedId: id }),
}));

export function visibleEvents(state: Pick<RadarState, 'events' | 'filters'>): ThreatEvent[] {
  return state.events.filter((e) => state.filters[e.category]);
}

/** The currently selected event (null if none or if it left the buffer). */
export function selectedEvent(state: Pick<RadarState, 'events' | 'selectedId'>): ThreatEvent | null {
  if (state.selectedId === null) return null;
  return state.events.find((e) => e.id === state.selectedId) ?? null;
}

/** Sum of all simulated events since the page loaded. */
export function totalCount(state: Pick<RadarState, 'totals'>): number {
  return state.totals.phishing + state.totals.login + state.totals.scanning + state.totals.traffic;
}
