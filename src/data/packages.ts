// PACKAGES — OWNER: content agent (completes copy in both languages). IDs + `includes` are a fixed contract.
import type { ComparisonRow, PackageId, ServicePackage } from './types';

export const PACKAGES: readonly ServicePackage[] = [
  {
    id: 'foundation',
    name: { en: 'Foundation Gate', ar: 'بوابة الأساس' },
    tagline: { en: 'Start with clarity.', ar: '' },
    bestFor: { en: 'Businesses taking their first structured security step.', ar: '' },
    includes: ['consultation', 'email-accounts'],
    highlights: {
      en: ['Cybersecurity consultation', 'Business account review', 'Prioritized action plan'],
      ar: ['', '', ''],
    },
    cadence: { en: 'One-time', ar: 'لمرة واحدة' },
    duration: { en: 'Estimated 1 week', ar: '' },
    pricing: { kind: 'quote' },
  },
  {
    id: 'business',
    name: { en: 'Business Gate', ar: 'بوابة الأعمال' },
    tagline: { en: 'Strengthen the front door.', ar: '' },
    bestFor: { en: 'Businesses with a website, shared email and a team to train.', ar: '' },
    includes: ['website-assessment', 'email-accounts', 'awareness'],
    highlights: {
      en: ['Website security assessment', 'Business email review', 'Employee awareness session'],
      ar: ['', '', ''],
    },
    cadence: { en: 'One-time', ar: 'لمرة واحدة' },
    duration: { en: 'Estimated 2–3 weeks', ar: '' },
    pricing: { kind: 'quote' },
  },
  {
    id: 'continuity',
    name: { en: 'Continuity Gate', ar: 'بوابة الاستمرارية' },
    tagline: { en: 'Keep improving, month after month.', ar: '' },
    bestFor: { en: 'Businesses that want scheduled reviews and follow-up.', ar: '' },
    includes: ['monthly-review'],
    highlights: {
      en: ['Recurring scheduled reviews', 'Concise monthly reporting', 'Follow-up on recommendations'],
      ar: ['', '', ''],
    },
    cadence: { en: 'Monthly (recurring)', ar: 'شهريًا (متكرر)' },
    duration: { en: 'Ongoing — monthly cycle', ar: '' },
    pricing: { kind: 'quote' },
  },
];

/** Package comparison rows — explain the ACTUAL differences between packages. */
export const COMPARISON: readonly ComparisonRow[] = [
  {
    id: 'consultation',
    label: { en: 'Introductory consultation', ar: '' },
    values: { foundation: true, business: false, continuity: false },
  },
];

const byId = new Map<PackageId, ServicePackage>(PACKAGES.map((p) => [p.id, p]));

export function getPackage(id: PackageId): ServicePackage {
  const pkg = byId.get(id);
  if (!pkg) throw new Error(`Unknown package ${id}`);
  return pkg;
}

export function isPackageId(value: string): value is PackageId {
  return byId.has(value as PackageId);
}
