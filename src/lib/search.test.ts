import { describe, expect, it } from 'vitest';
import type { Service } from '../data/types';
import { SERVICES } from '../data/services';
import { hasQuery, normalizeText, queryTokens, scoreService, searchServices } from './search';

const L = (en: string, ar = '') => ({ en, ar });
const LL = (en: string[], ar: string[] = []) => ({ en, ar });

function svc(partial: Partial<Service> & Pick<Service, 'id' | 'name'>): Service {
  return {
    audience: 'business',
    category: 'assessment',
    icon: 'Globe',
    primaryAction: 'add',
    benefit: L(''),
    audienceText: L(''),
    summary: L(''),
    scope: LL([]),
    exclusions: LL([]),
    deliverables: LL([]),
    duration: L(''),
    pricing: { kind: 'quote' },
    ...partial,
  };
}

// Fixture catalog (independent from the live copy, which the content team is still editing).
const FIXTURE: Service[] = [
  svc({
    id: 'website-assessment',
    name: L('Website Security Assessment', 'تقييم أمن الموقع الإلكتروني'),
    benefit: L('Find weaknesses on your company website.', 'اكتشف نقاط الضعف في موقع شركتك.'),
    summary: L('A structured review of web configuration and email forms.', 'مراجعة منظمة لإعدادات الموقع.'),
  }),
  svc({
    id: 'email-accounts',
    category: 'accounts',
    icon: 'MailCheck',
    name: L('Business Email & Account Security', 'أمن البريد الإلكتروني والحسابات للشركات'),
    benefit: L('Harden the accounts your business runs on.', 'عزّز حماية الحسابات التي تعتمد عليها شركتك.'),
    keywords: LL(['mfa', 'phishing', 'mailbox'], ['التحقق الثنائي', 'التصيُّد']),
  }),
  svc({
    id: 'ecommerce-review',
    icon: 'ShoppingCart',
    name: L('E-commerce Security Review', 'مراجعة أمن المتجر الإلكتروني'),
    benefit: L('Protect your store and your customers’ trust.', 'احمِ متجرك وثقة عملائك.'),
  }),
  svc({
    id: 'scam-awareness',
    audience: 'personal',
    category: 'training',
    icon: 'ShieldAlert',
    primaryAction: 'book',
    name: L('Scam & Phishing Awareness Session', 'جلسة توعية بالاحتيال والتصيّد'),
    benefit: L('Recognise scams before they cost you.', 'تعرّف على الاحتيال قبل أن يكلّفك.'),
    summary: L('A friendly session on common scams, including suspicious email.'),
  }),
];

const ids = (list: Service[]) => list.map((s) => s.id);

describe('normalizeText', () => {
  it('folds case, whitespace and punctuation', () => {
    expect(normalizeText('  Website   SECURITY—Assessment! ')).toBe('website security assessment');
  });

  it('removes Latin diacritics', () => {
    expect(normalizeText('Café Résumé naïve')).toBe('cafe resume naive');
  });

  it('removes Arabic tashkeel and tatweel', () => {
    expect(normalizeText('التَّصَيُّد')).toBe('التصيد');
    expect(normalizeText('الحـــماية')).toBe('الحمايه');
  });

  it('unifies alef, yaa, taa marbuta and hamza-carrier variants', () => {
    expect(normalizeText('أمن إدارة آمن ٱلعمل')).toBe('امن اداره امن العمل');
    expect(normalizeText('مستوى')).toBe('مستوي');
    expect(normalizeText('مؤسسة')).toBe('موسسه');
    expect(normalizeText('بيئة')).toBe('بييه');
  });

  it('maps Arabic-Indic digits to Latin digits', () => {
    expect(normalizeText('٢٤ ساعة')).toBe('24 ساعه');
  });
});

describe('queryTokens', () => {
  it('splits, normalises and de-duplicates', () => {
    expect(queryTokens('Email  email EMAIL')).toEqual(['email']);
  });

  it('strips Arabic definite-article prefixes from query tokens', () => {
    expect(queryTokens('البريد والحسابات')).toEqual(['بريد', 'حسابات']);
  });

  it('keeps short Arabic words intact', () => {
    expect(queryTokens('الأمن')).toEqual(['امن']);
    expect(queryTokens('الى')).toEqual(['الي']);
  });

  it('treats whitespace-only input as empty', () => {
    expect(queryTokens('   ')).toEqual([]);
    expect(hasQuery('  ')).toBe(false);
    expect(hasQuery(' a ')).toBe(true);
  });
});

describe('searchServices', () => {
  it('returns everything, in order, for an empty query', () => {
    expect(ids(searchServices(FIXTURE, '', 'en'))).toEqual(ids(FIXTURE));
    expect(ids(searchServices(FIXTURE, '   ', 'ar'))).toEqual(ids(FIXTURE));
  });

  it('matches English queries case-insensitively', () => {
    expect(ids(searchServices(FIXTURE, 'WEBSITE', 'en'))).toEqual(['website-assessment']);
  });

  it('ranks name matches above matches in other fields', () => {
    // "email" is in the email service NAME, but only in the summary of the other two.
    const result = ids(searchServices(FIXTURE, 'email', 'en'));
    expect(result[0]).toBe('email-accounts');
    expect(result).toContain('website-assessment');
    expect(result).toContain('scam-awareness');
  });

  it('requires every token of a multi-word query', () => {
    // "security" alone matches three names; adding "review" drops the email service (no "review" anywhere).
    const result = ids(searchServices(FIXTURE, 'security review', 'en'));
    expect(result[0]).toBe('ecommerce-review');
    expect(result).not.toContain('email-accounts');
    expect(ids(searchServices(FIXTURE, 'phishing session', 'en'))).toEqual(['scam-awareness']);
  });

  it('matches keywords and category labels', () => {
    expect(ids(searchServices(FIXTURE, 'mfa', 'en'))).toEqual(['email-accounts']);
    // "Awareness" is the label of the training category.
    expect(ids(searchServices(FIXTURE, 'awareness', 'en'))).toEqual(['scam-awareness']);
  });

  it('matches hyphenated words with or without the hyphen', () => {
    expect(ids(searchServices(FIXTURE, 'ecommerce', 'en'))).toEqual(['ecommerce-review']);
    expect(ids(searchServices(FIXTURE, 'e-commerce', 'en'))).toEqual(['ecommerce-review']);
  });

  it('matches Arabic queries regardless of tashkeel and letter variants', () => {
    expect(ids(searchServices(FIXTURE, 'التصيد', 'ar'))[0]).toBe('scam-awareness');
    expect(ids(searchServices(FIXTURE, 'التَّصَيُّد', 'ar'))[0]).toBe('scam-awareness');
    expect(ids(searchServices(FIXTURE, 'البريد', 'ar'))).toEqual(['email-accounts']);
    expect(ids(searchServices(FIXTURE, 'امن الموقع', 'ar'))).toEqual(['website-assessment']);
  });

  it('matches multi-word Arabic queries', () => {
    expect(ids(searchServices(FIXTURE, 'مراجعة المتجر', 'ar'))).toEqual(['ecommerce-review']);
  });

  it('lets Arabic visitors search with English words too', () => {
    expect(ids(searchServices(FIXTURE, 'email', 'ar'))[0]).toBe('email-accounts');
  });

  it('does not search Arabic text while the English UI is active', () => {
    expect(searchServices(FIXTURE, 'البريد', 'en')).toEqual([]);
  });

  it('returns an empty list when nothing matches', () => {
    expect(searchServices(FIXTURE, 'xyz', 'en')).toEqual([]);
    expect(searchServices(FIXTURE, 'website xyz', 'en')).toEqual([]);
    expect(scoreService(FIXTURE[0], ['xyz'], 'en')).toBe(0);
  });
});

describe('searchServices on the live catalog', () => {
  it('finds penetration testing in both languages', () => {
    expect(searchServices(SERVICES, 'penetration', 'en')[0]?.id).toBe('pen-testing');
    expect(searchServices(SERVICES, 'اختبار الاختراق', 'ar')[0]?.id).toBe('pen-testing');
  });

  it('puts the email service first for "email"', () => {
    expect(searchServices(SERVICES, 'email', 'en')[0]?.id).toBe('email-accounts');
  });
});
