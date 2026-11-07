// Content contract tests: completeness in both languages, honesty rules and package/catalog consistency.
import { describe, expect, it } from 'vitest';
import { CATEGORIES } from './categories';
import { COMPARISON, PACKAGES, getPackage } from './packages';
import { BUSINESS_SERVICE_IDS, PERSONAL_SERVICE_IDS, SERVICES, getService, isServiceId } from './services';
import type { L10n, L10nList, Lang, PackageId, Service, ServicePackage } from './types';

const LANGS: readonly Lang[] = ['en', 'ar'];
const PACKAGE_IDS: readonly PackageId[] = ['foundation', 'business', 'continuity'];

const SERVICE_TEXT_FIELDS = ['name', 'benefit', 'audienceText', 'summary', 'duration'] as const;
const SERVICE_LIST_FIELDS = ['scope', 'exclusions', 'deliverables', 'keywords'] as const;
const PACKAGE_TEXT_FIELDS = ['name', 'tagline', 'bestFor', 'cadence', 'duration'] as const;

/** Item-count ranges the brief asks for. */
const LIST_RANGES: Record<'scope' | 'exclusions' | 'deliverables', [number, number]> = {
  scope: [4, 6],
  exclusions: [2, 4],
  deliverables: [2, 4],
};

const ARABIC_LETTERS = /[ء-ي]/;
const PLACEHOLDER = /placeholder|lorem|ipsum|\btodo\b|\btbd\b|xxx/i;
const ESTIMATE_EN = /estimat/i;
const ESTIMATE_AR = /تقديري/;
// Honesty: no absolute promises or invented proof anywhere in the copy.
const BANNED_EN = /100\s?%|guaranteed|military[- ]grade|trusted by|bullet-?proof|unhackable|fully secure|certified by/i;
const BANNED_AR = /مضمون|مضمونة|100\s?%|موثوق من قبل/;
// "guarantee" / "ضمان" may only appear in exclusions (as in "no guarantee that every issue is found").
const GUARANTEE_EN = /guarantee/i;
const GUARANTEE_AR = /ضمان/;

function expectText(value: L10n | undefined, where: string): void {
  expect(value, where).toBeDefined();
  for (const lang of LANGS) {
    const text = value![lang];
    expect(typeof text, `${where}.${lang}`).toBe('string');
    expect(text.trim().length, `${where}.${lang} is empty`).toBeGreaterThan(0);
    expect(text, `${where}.${lang} has placeholder text`).not.toMatch(PLACEHOLDER);
  }
  expect(value!.ar, `${where}.ar should be written in Arabic`).toMatch(ARABIC_LETTERS);
}

function expectList(value: L10nList | undefined, where: string): void {
  expect(value, where).toBeDefined();
  const { en, ar } = value!;
  expect(en.length, `${where}.en is empty`).toBeGreaterThan(0);
  expect(ar.length, `${where}: en/ar item counts differ`).toBe(en.length);
  en.forEach((item, i) => expectText({ en: item, ar: ar[i] }, `${where}[${i}]`));
  expect(new Set(en).size, `${where}.en has duplicates`).toBe(en.length);
  expect(new Set(ar).size, `${where}.ar has duplicates`).toBe(ar.length);
}

/** Every string a service shows, per language, tagged by field. */
function serviceStrings(s: Service, lang: Lang): Array<{ field: string; text: string }> {
  const out: Array<{ field: string; text: string }> = [];
  for (const f of SERVICE_TEXT_FIELDS) out.push({ field: f, text: s[f][lang] });
  for (const f of SERVICE_LIST_FIELDS) for (const text of s[f]?.[lang] ?? []) out.push({ field: f, text });
  if (s.pricing.kind === 'illustrative') out.push({ field: 'pricing.per', text: s.pricing.per[lang] });
  return out;
}

function packageStrings(p: ServicePackage, lang: Lang): string[] {
  return [...PACKAGE_TEXT_FIELDS.map((f) => p[f][lang]), ...p.highlights[lang]];
}

function joined(s: Service, lang: Lang): string {
  return serviceStrings(s, lang)
    .map((x) => x.text)
    .join(' \n ');
}

describe('service catalog', () => {
  it('has 12 services with unique ids, split 8 business / 4 personal', () => {
    const ids = SERVICES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SERVICES).toHaveLength(12);
    expect([...BUSINESS_SERVICE_IDS].sort()).toEqual(SERVICES.filter((s) => s.audience === 'business').map((s) => s.id).sort());
    expect([...PERSONAL_SERVICE_IDS].sort()).toEqual(SERVICES.filter((s) => s.audience === 'personal').map((s) => s.id).sort());
    for (const id of ids) expect(isServiceId(id)).toBe(true);
    expect(isServiceId('not-a-service')).toBe(false);
  });

  it('keeps the English service names exactly as specified', () => {
    expect(SERVICES.map((s) => s.name.en)).toEqual([
      'Website Security Assessment',
      'Authorized Penetration Testing',
      'Business Email & Account Security',
      'Employee Security Awareness',
      'E-commerce Security Review',
      'Backup & Recovery Readiness',
      'Cybersecurity Consultation',
      'Monthly Security Review',
      'Personal Account Protection',
      'Device Security Settings Review',
      'Digital Privacy Review',
      'Scam & Phishing Awareness Session',
    ]);
  });

  describe.each(SERVICES.map((s): [string, Service] => [s.id, s]))('%s', (id, service) => {
    it('has non-empty English and Arabic text in every field', () => {
      for (const f of SERVICE_TEXT_FIELDS) expectText(service[f], `${id}.${f}`);
      for (const f of SERVICE_LIST_FIELDS) expectList(service[f], `${id}.${f}`);
      if (service.pricing.kind === 'illustrative') expectText(service.pricing.per, `${id}.pricing.per`);
    });

    it('has list sizes within the brief ranges', () => {
      for (const [field, [min, max]] of Object.entries(LIST_RANGES) as Array<[keyof typeof LIST_RANGES, [number, number]]>) {
        const count = service[field].en.length;
        expect(count, `${id}.${field} count`).toBeGreaterThanOrEqual(min);
        expect(count, `${id}.${field} count`).toBeLessThanOrEqual(max);
      }
      expect(service.keywords!.en.length, `${id}.keywords count`).toBeGreaterThanOrEqual(6);
    });

    it('phrases the duration as an estimate in both languages', () => {
      expect(service.duration.en).toMatch(ESTIMATE_EN);
      expect(service.duration.ar).toMatch(ESTIMATE_AR);
    });

    it('keeps the benefit to one concise sentence (card headline)', () => {
      for (const lang of LANGS) {
        const benefit = service.benefit[lang];
        expect(benefit.length, `${id}.benefit.${lang} length`).toBeLessThanOrEqual(90);
        expect(benefit.split(/[.!?؟]\s/).length, `${id}.benefit.${lang} sentences`).toBe(1);
      }
    });

    it('keeps the summary to one or two sentences', () => {
      for (const lang of LANGS) {
        const sentences = service.summary[lang].split(/[.!?؟]\s/).filter((x) => x.trim().length > 0);
        expect(sentences.length, `${id}.summary.${lang}`).toBeLessThanOrEqual(2);
      }
    });

    it('makes no absolute promises; "guarantee" only appears as an exclusion', () => {
      for (const { field, text } of serviceStrings(service, 'en')) {
        expect(text, `${id}.${field}`).not.toMatch(BANNED_EN);
        if (field !== 'exclusions') expect(text, `${id}.${field}`).not.toMatch(GUARANTEE_EN);
      }
      for (const { field, text } of serviceStrings(service, 'ar')) {
        expect(text, `${id}.${field}`).not.toMatch(BANNED_AR);
        if (field !== 'exclusions') expect(text, `${id}.${field}`).not.toMatch(GUARANTEE_AR);
      }
    });

    it('belongs to a category offered to its audience', () => {
      const category = CATEGORIES.find((c) => c.id === service.category);
      expect(category, `${id}.category`).toBeDefined();
      expect(category!.audiences).toContain(service.audience);
    });
  });

  it('requires authorization for penetration testing — and says so in both languages', () => {
    const pen = getService('pen-testing');
    expect(pen.requiresAuthorization).toBe(true);
    expect(pen.pricing.kind).toBe('quote');
    expect(pen.primaryAction).toBe('quote');
    expect(`${pen.summary.en} ${pen.audienceText.en}`).toMatch(/authori[sz]ation/i);
    expect(`${pen.summary.ar} ${pen.audienceText.ar}`).toMatch(/تفويض/);
    expect(pen.scope.en.join(' ')).toMatch(/authori[sz]ation/i);
    expect(pen.scope.ar.join(' ')).toMatch(/تفويض/);
    expect(pen.exclusions.en.join(' ')).toMatch(/without .*authori[sz]ation/i);
    expect(pen.exclusions.ar.join(' ')).toMatch(/دون تفويض/);
    // The scope varies, so it must be quote-based and say why.
    expect(pen.summary.en).toMatch(/scope/i);
    // Only pen testing carries the authorization flag.
    expect(SERVICES.filter((s) => s.requiresAuthorization).map((s) => s.id)).toEqual(['pen-testing']);
  });

  it('states that the monthly review is not a 24/7 monitoring service', () => {
    const monthly = getService('monthly-review');
    expect(monthly.exclusions.en.join(' ')).toMatch(/24\/7/);
    expect(monthly.exclusions.ar.join(' ')).toMatch(/على مدار الساعة/);
    expect(monthly.summary.en).toMatch(/not a staffed 24\/7 monitoring service/i);
    expect(monthly.summary.ar).toMatch(/ليست خدمة مراقبة على مدار الساعة/);
  });

  it('uses quote pricing for business services, except the illustrative consultation', () => {
    for (const s of SERVICES.filter((x) => x.audience === 'business')) {
      if (s.id === 'consultation') {
        expect(s.pricing.kind, s.id).toBe('illustrative');
      } else {
        expect(s.pricing.kind, s.id).toBe('quote');
      }
    }
  });

  it('gives personal services an illustrative price and a booking action', () => {
    for (const s of SERVICES.filter((x) => x.audience === 'personal')) {
      expect(s.pricing.kind, s.id).toBe('illustrative');
      if (s.pricing.kind === 'illustrative') {
        expect(s.pricing.amount, s.id).toBeGreaterThan(0);
        expect(s.pricing.currency, s.id).toBe('USD');
      }
      expect(s.primaryAction, s.id).toBe('book');
    }
  });

  it('never offers remote scanning of a person’s devices in personal services', () => {
    for (const s of SERVICES.filter((x) => x.audience === 'personal')) {
      expect(s.exclusions.en.join(' '), s.id).toMatch(/remote/i);
      expect(s.exclusions.ar.join(' '), s.id).toMatch(/عن بُ?عد/);
    }
  });

  it('includes the deliverables the brief requires', () => {
    const d = (id: Parameters<typeof getService>[0]) => getService(id).deliverables.en.join(' | ');
    expect(d('website-assessment')).toMatch(/findings report with prioritized recommendations/i);
    expect(d('pen-testing')).toMatch(/scoped assessment report/i);
    expect(d('pen-testing')).toMatch(/remediation guidance/i);
    expect(d('email-accounts')).toMatch(/configuration review/i);
    expect(d('email-accounts')).toMatch(/multi-factor authentication|MFA/i);
    expect(d('email-accounts')).toMatch(/access recommendations/i);
    expect(d('awareness')).toMatch(/phishing, suspicious links and data handling/i);
    expect(d('ecommerce-review')).toMatch(/store settings, extensions and administrator access/i);
    expect(d('backup-recovery')).toMatch(/backup arrangements/i);
    expect(d('backup-recovery')).toMatch(/recovery recommendations/i);
    expect(d('consultation')).toMatch(/introductory session/i);
    expect(d('consultation')).toMatch(/prioritized action plan/i);
    expect(d('monthly-review')).toMatch(/scheduled reviews/i);
    expect(d('monthly-review')).toMatch(/concise report/i);
    expect(d('monthly-review')).toMatch(/follow-up on .*recommendations/i);
  });

  it('is findable by common synonyms in both languages', () => {
    const find = (term: string, lang: Lang) =>
      SERVICES.filter((s) => joined(s, lang).toLowerCase().includes(term.toLowerCase())).map((s) => s.id);
    expect(find('MFA', 'en')).toContain('email-accounts');
    expect(find('2FA', 'en')).toContain('personal-accounts');
    expect(find('phishing', 'en')).toEqual(expect.arrayContaining(['awareness', 'scam-awareness']));
    expect(find('ransomware', 'en')).toContain('backup-recovery');
    expect(find('Shopify', 'en')).toContain('ecommerce-review');
    expect(find('WooCommerce', 'en')).toContain('ecommerce-review');
    expect(find('privacy', 'en')).toContain('privacy-review');
    expect(find('scam', 'en')).toContain('scam-awareness');
    expect(find('التصيّد الاحتيالي', 'ar')).toEqual(expect.arrayContaining(['awareness', 'scam-awareness']));
    expect(find('المصادقة الثنائية', 'ar')).toEqual(expect.arrayContaining(['email-accounts', 'personal-accounts']));
    expect(find('برامج الفدية', 'ar')).toContain('backup-recovery');
    expect(find('اختبار الاختراق', 'ar')).toContain('pen-testing');
    expect(find('الخصوصية', 'ar')).toContain('privacy-review');
  });

  it('uses consistent Arabic terminology', () => {
    const all = SERVICES.map((s) => joined(s, 'ar')).join(' ');
    // Preferred terms are present…
    for (const term of ['التصيّد الاحتيالي', 'المصادقة متعددة العوامل', 'النسخ الاحتياطي', 'اختبار الاختراق']) {
      expect(all, term).toContain(term);
    }
    // …and competing translations of the same concepts are not.
    for (const avoid of ['الخداع الإلكتروني', 'التحقق متعدد العوامل', 'النسخ الإحتياطي', 'فحص الاختراق']) {
      expect(all, avoid).not.toContain(avoid);
    }
  });
});

describe('packages', () => {
  it('has the three packages with unique ids', () => {
    expect(PACKAGES.map((p) => p.id)).toEqual(PACKAGE_IDS);
    for (const id of PACKAGE_IDS) expect(getPackage(id).id).toBe(id);
  });

  describe.each(PACKAGES.map((p): [string, ServicePackage] => [p.id, p]))('%s', (id, pkg) => {
    it('has non-empty English and Arabic copy in every field', () => {
      for (const f of PACKAGE_TEXT_FIELDS) expectText(pkg[f], `${id}.${f}`);
      expectList(pkg.highlights, `${id}.highlights`);
      expect(pkg.highlights.en.length).toBeGreaterThanOrEqual(3);
    });

    it('phrases the duration as an estimate in both languages', () => {
      expect(pkg.duration.en).toMatch(ESTIMATE_EN);
      expect(pkg.duration.ar).toMatch(ESTIMATE_AR);
    });

    it('bundles only real, unique business services and is quote-based', () => {
      expect(pkg.includes.length).toBeGreaterThan(0);
      expect(new Set(pkg.includes).size).toBe(pkg.includes.length);
      for (const sid of pkg.includes) {
        expect(isServiceId(sid), `${id} includes ${sid}`).toBe(true);
        expect(getService(sid).audience, `${id} includes ${sid}`).toBe('business');
      }
      expect(pkg.pricing.kind).toBe('quote');
    });

    it('makes no absolute promises', () => {
      for (const text of packageStrings(pkg, 'en')) {
        expect(text).not.toMatch(BANNED_EN);
        expect(text).not.toMatch(GUARANTEE_EN);
      }
      for (const text of packageStrings(pkg, 'ar')) {
        expect(text).not.toMatch(BANNED_AR);
        expect(text).not.toMatch(GUARANTEE_AR);
      }
    });
  });

  it('keeps the brief’s package contents', () => {
    expect(getPackage('foundation').includes).toEqual(['consultation', 'email-accounts']);
    expect(getPackage('business').includes).toEqual(['website-assessment', 'email-accounts', 'awareness']);
    expect(getPackage('continuity').includes).toEqual(['monthly-review']);
    expect(getPackage('continuity').highlights.en.join(' ')).toMatch(/not a 24\/7 monitoring service/i);
  });
});

describe('package comparison', () => {
  it('has 7–10 rows with unique ids and complete labels', () => {
    expect(COMPARISON.length).toBeGreaterThanOrEqual(7);
    expect(COMPARISON.length).toBeLessThanOrEqual(10);
    const ids = COMPARISON.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const row of COMPARISON) expectText(row.label, `comparison.${row.id}.label`);
  });

  it('covers all three packages in every row, with complete text values', () => {
    for (const row of COMPARISON) {
      expect(Object.keys(row.values).sort(), row.id).toEqual([...PACKAGE_IDS].sort());
      for (const pid of PACKAGE_IDS) {
        const value = row.values[pid];
        if (typeof value === 'boolean') continue;
        expectText(value, `comparison.${row.id}.${pid}`);
      }
    }
  });

  it('agrees with each package’s `includes` for service rows', () => {
    const serviceRows = COMPARISON.filter((r) => isServiceId(r.id));
    expect(serviceRows.length).toBeGreaterThan(0);
    for (const row of serviceRows) {
      for (const pid of PACKAGE_IDS) {
        const bundled = (getPackage(pid).includes as readonly string[]).includes(row.id);
        expect(row.values[pid], `${row.id} × ${pid}`).toBe(bundled);
      }
    }
    // Every bundled service has its own row.
    const rowIds = new Set(serviceRows.map((r) => r.id));
    for (const pkg of PACKAGES) for (const sid of pkg.includes) expect(rowIds.has(sid), sid).toBe(true);
  });

  it('shows a real difference in every row (no row is identical across packages)', () => {
    for (const row of COMPARISON) {
      const signatures = PACKAGE_IDS.map((pid) => JSON.stringify(row.values[pid]));
      expect(new Set(signatures).size, row.id).toBeGreaterThan(1);
    }
  });

  it('explains best fit, engagement type, action plan & reporting, follow-up and the estimated timeline', () => {
    const row = (id: string) => {
      const found = COMPARISON.find((r) => r.id === id);
      expect(found, `comparison row "${id}"`).toBeDefined();
      return found!;
    };
    const text = (id: string, pid: PackageId) => row(id).values[pid] as L10n;

    // Text rows hold a value for every package (no check/dash shortcuts).
    for (const id of ['best-for', 'engagement', 'plan-reporting', 'timeline']) {
      for (const pid of PACKAGE_IDS) expect(typeof row(id).values[pid], `${id} × ${pid}`).toBe('object');
    }
    expect(text('engagement', 'foundation')).toEqual(text('engagement', 'business'));
    expect(text('engagement', 'continuity').en).toMatch(/recurring/i);
    expect(text('engagement', 'continuity').en).toMatch(/not 24\/7/i);
    expect(text('engagement', 'continuity').ar).toMatch(/على مدار الساعة/);
    expect(text('plan-reporting', 'foundation').en).toMatch(/action plan/i);
    expect(text('plan-reporting', 'business').en).toMatch(/findings report/i);
    expect(text('plan-reporting', 'continuity').en).toMatch(/every month/i);
    expect(row('follow-up').values).toEqual({ foundation: false, business: false, continuity: true });
    for (const pid of PACKAGE_IDS) expect(row('timeline').values[pid]).toEqual(getPackage(pid).duration);
    // Table text stays short enough for a comparison cell.
    for (const r of COMPARISON) {
      for (const pid of PACKAGE_IDS) {
        const v = r.values[pid];
        if (typeof v !== 'boolean') for (const lang of LANGS) expect(v[lang].length, `${r.id} × ${pid}.${lang}`).toBeLessThanOrEqual(70);
      }
    }
  });
});
