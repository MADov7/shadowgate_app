// Catalog search: forgiving, bilingual, dependency-free.
//
// Normalisation folds the differences people do not type consistently:
//   • case and repeated whitespace / punctuation
//   • Latin diacritics (café → cafe)
//   • Arabic tashkeel (harakat, shadda, sukun…), tatweel (ـ) and Quranic marks
//   • Arabic letter variants: أ إ آ ٱ → ا, ى → ي, ة → ه, ؤ → و, ئ → ي, Persian ی/ک → ي/ك
//   • Arabic-Indic digits → Latin digits
// Every query token must appear (substring) somewhere in the service text — in the active language AND in
// English, so an Arabic visitor can still type "email". Name matches rank first.
import type { Lang, Service } from '../data/types';
import { categoryById } from '../data/categories';

const ARABIC_MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g; // tashkeel, Quranic marks, tatweel
const COMBINING = /\p{M}/gu;
const NON_WORD = /[^\p{L}\p{N}]+/gu;

const LETTER_MAP: Record<string, string> = {
  'أ': 'ا', // أ
  'إ': 'ا', // إ
  'آ': 'ا', // آ
  'ٱ': 'ا', // ٱ
  'ى': 'ي', // ى → ي
  'ة': 'ه', // ة → ه
  'ؤ': 'و', // ؤ → و
  'ئ': 'ي', // ئ → ي
  'ی': 'ي', // ی → ي
  'ک': 'ك', // ک → ك
};
const LETTER_RE = new RegExp(`[${Object.keys(LETTER_MAP).join('')}]`, 'g');

function foldDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660)).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** Folds case, diacritics, Arabic marks/variants and punctuation into a single comparable form. */
export function normalizeText(value: string): string {
  if (!value) return '';
  let s = value.toLowerCase();
  s = s.replace(ARABIC_MARKS, '');
  s = s.replace(LETTER_RE, (ch) => LETTER_MAP[ch] ?? ch); // before NFD so hamza forms map predictably
  s = s.normalize('NFD').replace(COMBINING, '').normalize('NFC');
  s = s.replace(LETTER_RE, (ch) => LETTER_MAP[ch] ?? ch);
  s = foldDigits(s);
  s = s.replace(/[’'’]/g, ''); // customer’s → customers
  s = s.replace(NON_WORD, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Normalised text plus a variant with joiners removed, so "ecommerce" matches "E-commerce"
 * and "e commerce" still matches too.
 */
function haystack(value: string): string {
  if (!value) return '';
  const split = normalizeText(value);
  const joined = normalizeText(value.replace(/[-‐‑/·.]/g, ''));
  return joined === split ? split : `${split} ${joined}`;
}

// Arabic clitic prefixes ("the", "and the", "with the", "for the"). Stripping them from a QUERY token only
// broadens a substring match: "البريد" → "بريد" still matches "البريد" and "بريد".
const AR_PREFIXES = ['وال', 'بال', 'كال', 'فال', 'لل', 'ال'];
const ARABIC_LETTER = /[ء-ي]/;

function stripArabicPrefix(token: string): string {
  if (!ARABIC_LETTER.test(token)) return token;
  for (const prefix of AR_PREFIXES) {
    if (token.startsWith(prefix) && token.length - prefix.length >= 3) return token.slice(prefix.length);
  }
  return token;
}

/** Splits a raw query into normalised, de-duplicated tokens. */
export function queryTokens(query: string): string[] {
  const tokens = normalizeText(query)
    .split(' ')
    .filter(Boolean)
    .map(stripArabicPrefix);
  return [...new Set(tokens)];
}

interface Fields {
  name: string;
  benefit: string;
  summary: string;
  audience: string;
  keywords: string;
  category: string;
}

const FIELD_WEIGHT: Record<keyof Fields, number> = {
  name: 100,
  keywords: 24,
  benefit: 16,
  category: 12,
  summary: 8,
  audience: 6,
};

const cache = new Map<string, Fields>();

function fieldsFor(service: Service, lang: Lang): Fields {
  const key = `${service.id}|${lang}|${service.name[lang]}|${service.summary[lang]}`;
  const hit = cache.get(key);
  if (hit) return hit;
  // Active language first, English always included (Arabic copy may also be incomplete while drafting).
  const langs: Lang[] = lang === 'en' ? ['en'] : [lang, 'en'];
  const join = (pick: (l: Lang) => string) => langs.map((l) => haystack(pick(l))).filter(Boolean).join(' | ');
  let category = '';
  try {
    const cat = categoryById(service.category);
    category = join((l) => cat.label[l]);
  } catch {
    category = '';
  }
  const fields: Fields = {
    name: join((l) => service.name[l]),
    benefit: join((l) => service.benefit[l]),
    summary: join((l) => service.summary[l]),
    audience: join((l) => service.audienceText[l]),
    keywords: join((l) => (service.keywords?.[l] ?? []).join(' ')),
    category,
  };
  cache.set(key, fields);
  return fields;
}

/**
 * Relevance score for one service, or 0 when any token is missing.
 * Name hits dominate; a token at the start of a word scores a little more than one mid-word.
 */
export function scoreService(service: Service, tokens: readonly string[], lang: Lang): number {
  if (tokens.length === 0) return 1;
  const fields = fieldsFor(service, lang);
  let total = 0;
  for (const token of tokens) {
    let best = 0;
    for (const field of Object.keys(FIELD_WEIGHT) as Array<keyof Fields>) {
      const text = fields[field];
      if (!text) continue;
      const at = text.indexOf(token);
      if (at === -1) continue;
      const wordStart = at === 0 || text[at - 1] === ' ';
      const score = FIELD_WEIGHT[field] * (wordStart ? 1.25 : 1);
      if (score > best) best = score;
    }
    if (best === 0) return 0;
    total += best;
  }
  // Bonus when the whole phrase appears in the name in order (e.g. "account protection").
  if (tokens.length > 1 && fields.name.includes(tokens.join(' '))) total += 60;
  return total;
}

/**
 * Filters and ranks services for a query. An empty query returns the input order unchanged.
 * Ties keep the catalog order (stable sort).
 */
export function searchServices<S extends Service>(services: readonly S[], query: string, lang: Lang): S[] {
  const tokens = queryTokens(query);
  if (tokens.length === 0) return [...services];
  return services
    .map((service, index) => ({ service, index, score: scoreService(service, tokens, lang) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((r) => r.service);
}

/** True when the query has at least one meaningful token. */
export function hasQuery(query: string): boolean {
  return queryTokens(query).length > 0;
}
