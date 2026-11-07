// Typed i18n key maps + formatting helpers shared by the radar panels.
import type { Lang } from '../../data/types';
import type { TKey } from '../../i18n';
import type { ResponseKind } from '../../lib/threatSim';
import type { Outcome, Severity, ThreatCategory } from '../../state/radar';

export const CAT_LABEL: Record<ThreatCategory, TKey> = {
  phishing: 'radar.catPhishing',
  login: 'radar.catLogin',
  scanning: 'radar.catScanning',
  traffic: 'radar.catTraffic',
};

/** Compact labels for the dense feed rows (full names appear in chips, details and globe caption). */
export const CAT_SHORT: Record<ThreatCategory, TKey> = {
  phishing: 'radar.catShortPhishing',
  login: 'radar.catShortLogin',
  scanning: 'radar.catShortScanning',
  traffic: 'radar.catShortTraffic',
};

export const CAT_ABOUT: Record<ThreatCategory, TKey> = {
  phishing: 'radar.aboutPhishing',
  login: 'radar.aboutLogin',
  scanning: 'radar.aboutScanning',
  traffic: 'radar.aboutTraffic',
};

export const CAT_DESC: Record<ThreatCategory, readonly TKey[]> = {
  phishing: ['radar.descPhishing0', 'radar.descPhishing1', 'radar.descPhishing2', 'radar.descPhishing3'],
  login: ['radar.descLogin0', 'radar.descLogin1', 'radar.descLogin2', 'radar.descLogin3'],
  scanning: ['radar.descScanning0', 'radar.descScanning1', 'radar.descScanning2', 'radar.descScanning3'],
  traffic: ['radar.descTraffic0', 'radar.descTraffic1', 'radar.descTraffic2', 'radar.descTraffic3'],
};

export const SEV_LABEL: Record<Severity, TKey> = {
  low: 'radar.sevLow',
  medium: 'radar.sevMedium',
  high: 'radar.sevHigh',
};
export const SEV_LEVEL: Record<Severity, number> = { low: 1, medium: 2, high: 3 };

export const OUT_LABEL: Record<Outcome, TKey> = {
  blocked: 'radar.outBlocked',
  flagged: 'radar.outFlagged',
  observed: 'radar.outObserved',
};
export const OUT_NOTE: Record<Outcome, TKey> = {
  blocked: 'radar.outNoteBlocked',
  flagged: 'radar.outNoteFlagged',
  observed: 'radar.outNoteObserved',
};

export const RESPONSE_TEXT: Record<ResponseKind, TKey> = {
  phishing: 'radar.respPhishing',
  login: 'radar.respLogin',
  scanning: 'radar.respScanning',
  'traffic-site': 'radar.respTrafficSite',
  'traffic-review': 'radar.respTrafficReview',
};

/** Stack order (bottom → top) for the graph and legend order for the chips. */
export const STACK_ORDER: readonly ThreatCategory[] = ['scanning', 'phishing', 'login', 'traffic'];

const clockFormats = new Map<Lang, Intl.DateTimeFormat>();
/** HH:MM:SS, 24-hour, Latin digits in both languages (matches the mono telemetry). */
export function formatClock(t: number, lang: Lang): string {
  let f = clockFormats.get(lang);
  if (!f) {
    f = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    clockFormats.set(lang, f);
  }
  return f.format(t);
}
