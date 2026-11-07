// PACKAGES — OWNER: content agent. IDs, `includes` and pricing kind are a fixed contract; copy is bilingual.
import type { ComparisonRow, L10n, PackageId, ServicePackage } from './types';

export const PACKAGES: readonly ServicePackage[] = [
  {
    id: 'foundation',
    name: { en: 'Foundation Gate', ar: 'بوابة الأساس' },
    tagline: { en: 'Start with clarity.', ar: 'ابدأ بوضوح.' },
    bestFor: {
      en: 'Businesses taking their first structured security step.',
      ar: 'الشركات التي تخطو أولى خطواتها المنظَّمة نحو الأمن السيبراني.',
    },
    includes: ['consultation', 'email-accounts'],
    highlights: {
      en: [
        'Introductory cybersecurity consultation',
        'Business email & account review with MFA guidance',
        'Prioritized action plan in writing',
      ],
      ar: [
        'استشارة تعريفية في الأمن السيبراني',
        'مراجعة البريد الإلكتروني والحسابات مع إرشادات المصادقة متعددة العوامل',
        'خطة عمل مكتوبة مرتبة حسب الأولوية',
      ],
    },
    cadence: { en: 'One-time', ar: 'لمرة واحدة' },
    duration: { en: 'Estimated 1 week', ar: 'أسبوع واحد تقديريًا' },
    pricing: { kind: 'quote' },
  },
  {
    id: 'business',
    name: { en: 'Business Gate', ar: 'بوابة الأعمال' },
    tagline: { en: 'Strengthen the front door.', ar: 'حصّن بوابتك الأمامية.' },
    bestFor: {
      en: 'Businesses with a website, shared email and a team to train.',
      ar: 'الشركات التي تملك موقعًا إلكترونيًا وبريدًا مشتركًا وفريقًا تودّ تدريبه.',
    },
    includes: ['website-assessment', 'email-accounts', 'awareness'],
    highlights: {
      en: [
        'Website security assessment with a prioritized findings report',
        'Business email & account review',
        'Employee security awareness session',
      ],
      ar: [
        'تقييم أمن الموقع الإلكتروني مع تقرير نتائج مرتب حسب الأولوية',
        'مراجعة البريد الإلكتروني والحسابات للشركة',
        'جلسة توعية أمنية للموظفين',
      ],
    },
    cadence: { en: 'One-time', ar: 'لمرة واحدة' },
    duration: { en: 'Estimated 2–3 weeks', ar: 'من أسبوعين إلى 3 أسابيع تقديريًا' },
    pricing: { kind: 'quote' },
  },
  {
    id: 'continuity',
    name: { en: 'Continuity Gate', ar: 'بوابة الاستمرارية' },
    tagline: { en: 'Keep improving, month after month.', ar: 'تحسّن مستمر، شهرًا بعد شهر.' },
    bestFor: {
      en: 'Businesses that want scheduled reviews and follow-up without a full-time security team.',
      ar: 'الشركات التي تريد مراجعات مجدولة ومتابعة منتظمة دون فريق أمني متفرغ.',
    },
    includes: ['monthly-review'],
    highlights: {
      en: [
        'Recurring scheduled reviews',
        'Concise monthly reporting',
        'Follow-up on recommendations',
        'Scheduled reviews — not a 24/7 monitoring service',
      ],
      ar: [
        'مراجعات دورية مجدولة',
        'تقارير شهرية موجزة',
        'متابعة تنفيذ التوصيات',
        'مراجعات مجدولة، وليست خدمة مراقبة على مدار الساعة (24/7)',
      ],
    },
    cadence: { en: 'Monthly (recurring)', ar: 'شهريًا (متكرر)' },
    duration: { en: 'Ongoing — estimated monthly cycle', ar: 'مستمرة — دورة شهرية تقديرية' },
    pricing: { kind: 'quote' },
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

const ONE_TIME: L10n = { en: 'One-time', ar: 'لمرة واحدة' };

/**
 * Package comparison rows — explain the ACTUAL differences between packages.
 * Rows whose id is a service id say whether that service is bundled (kept in sync with `includes` by tests).
 */
export const COMPARISON: readonly ComparisonRow[] = [
  {
    id: 'best-for',
    label: { en: 'Best for', ar: 'الأنسب لـ' },
    values: {
      foundation: { en: 'A first structured security step', ar: 'أول خطوة منظَّمة نحو الأمن السيبراني' },
      business: { en: 'A website, shared email and a team to train', ar: 'موقع إلكتروني وبريد مشترك وفريق يحتاج إلى تدريب' },
      continuity: { en: 'Ongoing follow-up without a full-time security team', ar: 'متابعة مستمرة دون فريق أمني متفرغ' },
    },
  },
  {
    id: 'engagement',
    label: { en: 'Engagement type', ar: 'نمط التعاقد' },
    values: {
      foundation: ONE_TIME,
      business: ONE_TIME,
      continuity: {
        en: 'Recurring monthly (not 24/7 monitoring)',
        ar: 'متكرر شهريًا (وليس مراقبة على مدار الساعة)',
      },
    },
  },
  {
    id: 'consultation',
    label: { en: 'Introductory consultation', ar: 'استشارة تعريفية' },
    values: { foundation: true, business: false, continuity: false },
  },
  {
    id: 'email-accounts',
    label: { en: 'Business email & account review', ar: 'مراجعة البريد الإلكتروني والحسابات' },
    values: { foundation: true, business: true, continuity: false },
  },
  {
    id: 'website-assessment',
    label: { en: 'Website security assessment', ar: 'تقييم أمن الموقع الإلكتروني' },
    values: { foundation: false, business: true, continuity: false },
  },
  {
    id: 'awareness',
    label: { en: 'Staff awareness session', ar: 'جلسة توعية للموظفين' },
    values: { foundation: false, business: true, continuity: false },
  },
  {
    id: 'monthly-review',
    label: { en: 'Scheduled monthly reviews', ar: 'مراجعات شهرية مجدولة' },
    values: { foundation: false, business: false, continuity: true },
  },
  {
    // Action plan + reporting cadence in one row: what you receive in writing, and how often.
    id: 'plan-reporting',
    label: { en: 'Action plan & reporting', ar: 'خطة العمل والتقارير' },
    values: {
      foundation: {
        en: 'A prioritized action plan, delivered once',
        ar: 'خطة عمل مرتبة حسب الأولوية، تُسلَّم مرة واحدة',
      },
      business: {
        en: 'One findings report with prioritized recommendations',
        ar: 'تقرير نتائج واحد مع توصيات مرتبة حسب الأولوية',
      },
      continuity: {
        en: 'A concise report every month, tracking the plan’s progress',
        ar: 'تقرير موجز كل شهر يتابع التقدّم في خطة العمل',
      },
    },
  },
  {
    id: 'follow-up',
    label: { en: 'Follow-up on recommendations', ar: 'متابعة تنفيذ التوصيات' },
    values: { foundation: false, business: false, continuity: true },
  },
  {
    id: 'timeline',
    label: { en: 'Estimated timeline', ar: 'المدة التقديرية' },
    values: {
      foundation: getPackage('foundation').duration,
      business: getPackage('business').duration,
      continuity: getPackage('continuity').duration,
    },
  },
];
