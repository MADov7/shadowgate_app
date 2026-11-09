// Lightweight typed i18n. English is the source of truth; Arabic files are typed against it,
// so a missing or extra Arabic key is a compile error.
import { useCallback } from 'react';
import { create } from 'zustand';
import type { L10n, L10nList, Lang } from '../data/types';
import { KEYS, readString, writeString } from '../lib/storage';
import { urlFlag } from '../lib/capabilities';
import { IS_DEV } from '../lib/env';
import { en } from './locales/en';
import { ar } from './locales/ar';

export type Dict = typeof en;
export type Namespace = keyof Dict;
export type TKey = { [N in Namespace]: `${N & string}.${keyof Dict[N] & string}` }[Namespace];
export type TVars = Record<string, string | number>;

const dictionaries: Record<Lang, Dict> = { en, ar: ar as unknown as Dict };

function initialLang(): Lang {
  const fromUrl = urlFlag('lang');
  if (fromUrl === 'ar' || fromUrl === 'en') return fromUrl;
  return readString(KEYS.lang) === 'ar' ? 'ar' : 'en';
}

export function applyLangToDocument(lang: Lang): void {
  const root = document.documentElement;
  root.lang = lang;
  root.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.title = translateIn(lang, 'common.docTitle');
  document.querySelector('meta[name="description"]')?.setAttribute('content', translateIn(lang, 'common.metaDescription'));
}

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: initialLang(),
  setLang: (lang) => {
    writeString(KEYS.lang, lang);
    applyLangToDocument(lang);
    set({ lang });
  },
}));

function interpolate(template: string, vars?: TVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function translateIn(lang: Lang, key: TKey, vars?: TVars): string {
  const dot = key.indexOf('.');
  const ns = key.slice(0, dot) as Namespace;
  const k = key.slice(dot + 1);
  const table = dictionaries[lang][ns] as Record<string, string> | undefined;
  const fallback = dictionaries.en[ns] as Record<string, string> | undefined;
  const value = table?.[k] ?? fallback?.[k];
  if (value === undefined) {
    if (IS_DEV) console.warn(`[i18n] missing key ${key}`);
    return key;
  }
  return interpolate(value, vars);
}

/** Non-hook translator for use in event handlers/stores (reads the current language). */
export function translate(key: TKey, vars?: TVars): string {
  return translateIn(useLangStore.getState().lang, key, vars);
}

/** Format numbers with Latin digits in both languages (consistent with mono telemetry). */
export function formatNumber(value: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === 'ar' ? 'ar-u-nu-latn' : 'en-US').format(value);
}

export function useI18n() {
  const lang = useLangStore((s) => s.lang);
  const t = useCallback((key: TKey, vars?: TVars) => translateIn(lang, key, vars), [lang]);
  const loc = useCallback((value: L10n) => value[lang], [lang]);
  const locList = useCallback((value: L10nList) => value[lang], [lang]);
  return { lang, dir: (lang === 'ar' ? 'rtl' : 'ltr') as 'rtl' | 'ltr', t, loc, locList, isAr: lang === 'ar' };
}
