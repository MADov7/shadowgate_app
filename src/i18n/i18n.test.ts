// Locale parity tests. Generic over the namespace registry AND the files on disk, so namespaces that other
// builders add or extend are covered automatically: same keys in en/ar, no empty values, same {placeholders}.
import { describe, expect, it } from 'vitest';
import { en } from './locales/en';
import { ar } from './locales/ar';
import { translateIn } from './index';

type Table = Record<string, unknown>;
type Registry = Record<string, Table>;

const enRegistry = en as unknown as Registry;
const arRegistry = ar as unknown as Registry;
const NAMESPACES = Object.keys(enRegistry).sort();

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholders(value: string): string[] {
  return [...new Set([...value.matchAll(PLACEHOLDER)].map((m) => m[1]))].sort();
}

/** True when every brace belongs to a well-formed {name} placeholder. */
function bracesAreWellFormed(value: string): boolean {
  return !/[{}]/.test(value.replace(PLACEHOLDER, ''));
}

/** Compares one English table with its Arabic twin and returns readable problems (empty = OK). */
function tableProblems(ns: string, enTable: Table, arTable: Table | undefined): string[] {
  if (!arTable) return [`${ns}: missing Arabic table`];
  const problems: string[] = [];
  const enKeys = Object.keys(enTable).sort();
  const arKeys = Object.keys(arTable).sort();
  for (const k of enKeys) if (!(k in arTable)) problems.push(`${ns}.${k}: missing in ar`);
  for (const k of arKeys) if (!(k in enTable)) problems.push(`${ns}.${k}: extra in ar (not in en)`);
  for (const k of enKeys) {
    const e = enTable[k];
    const a = arTable[k];
    if (typeof e !== 'string') problems.push(`${ns}.${k}: en value is not a string (keys must be flat)`);
    if (k in arTable && typeof a !== 'string') problems.push(`${ns}.${k}: ar value is not a string`);
    if (typeof e !== 'string' || typeof a !== 'string') continue;
    if (e.trim() === '') problems.push(`${ns}.${k}: empty en value`);
    if (a.trim() === '') problems.push(`${ns}.${k}: empty ar value`);
    if (!bracesAreWellFormed(e)) problems.push(`${ns}.${k}: malformed placeholder in en`);
    if (!bracesAreWellFormed(a)) problems.push(`${ns}.${k}: malformed placeholder in ar`);
    const pe = placeholders(e).join(',');
    const pa = placeholders(a).join(',');
    if (pe !== pa) problems.push(`${ns}.${k}: placeholders differ (en {${pe}} vs ar {${pa}})`);
  }
  return problems;
}

describe('i18n registry', () => {
  it('registers the same namespaces for English and Arabic', () => {
    expect(Object.keys(arRegistry).sort()).toEqual(NAMESPACES);
    expect(NAMESPACES.length).toBeGreaterThan(0);
  });

  describe.each(NAMESPACES)('namespace "%s"', (ns) => {
    const problems = () => tableProblems(ns, enRegistry[ns], arRegistry[ns]);

    it('has identical keys in en and ar', () => {
      expect(problems().filter((p) => /missing in ar|extra in ar|missing Arabic/.test(p))).toEqual([]);
    });

    it('has no empty or non-string values', () => {
      expect(problems().filter((p) => /empty|not a string/.test(p))).toEqual([]);
    });

    it('uses identical {placeholder} sets per key', () => {
      expect(problems().filter((p) => /placeholder/.test(p))).toEqual([]);
    });
  });
});

// Every namespace file on disk (registered or not) must have an Arabic twin with the same shape.
const enFiles = import.meta.glob<Record<string, unknown>>('./locales/en/*.ts', { eager: true });
const arFiles = import.meta.glob<Record<string, unknown>>('./locales/ar/*.ts', { eager: true });

function byBaseName(files: Record<string, Record<string, unknown>>): Map<string, Record<string, unknown>> {
  const out = new Map<string, Record<string, unknown>>();
  for (const [path, mod] of Object.entries(files)) {
    const base = path.split('/').pop()!.replace(/\.ts$/, '');
    if (base !== 'index') out.set(base, mod);
  }
  return out;
}

/** The single table a namespace module exports (e.g. `heroEn` / `heroAr`). */
function exportedTable(mod: Record<string, unknown>): Table | undefined {
  const tables = Object.values(mod).filter((v): v is Table => typeof v === 'object' && v !== null);
  return tables.length === 1 ? tables[0] : undefined;
}

describe('i18n locale files', () => {
  const enByName = byBaseName(enFiles);
  const arByName = byBaseName(arFiles);

  it('has an Arabic file for every English namespace file, and vice versa', () => {
    expect([...arByName.keys()].sort()).toEqual([...enByName.keys()].sort());
  });

  it('registers every namespace file in the registry', () => {
    expect([...enByName.keys()].filter((name) => !(name in enRegistry))).toEqual([]);
  });

  it('exports one table per file, with matching keys, values and placeholders', () => {
    const problems: string[] = [];
    for (const [name, enMod] of enByName) {
      const enTable = exportedTable(enMod);
      const arMod = arByName.get(name);
      const arTable = arMod ? exportedTable(arMod) : undefined;
      if (!enTable) {
        problems.push(`${name}: en file should export exactly one table`);
        continue;
      }
      if (arMod && !arTable) {
        problems.push(`${name}: ar file should export exactly one table`);
        continue;
      }
      problems.push(...tableProblems(name, enTable, arTable));
    }
    expect(problems).toEqual([]);
  });
});

describe('translateIn', () => {
  it('interpolates placeholders in both languages', () => {
    expect(translateIn('en', 'common.toastAdded', { name: 'X' })).toContain('X');
    expect(translateIn('ar', 'common.toastAdded', { name: 'X' })).toContain('X');
    expect(translateIn('en', 'nav.basketCount', { count: 3 })).toContain('3');
  });

  it('leaves unknown placeholders untouched', () => {
    expect(translateIn('en', 'common.toastAdded')).toContain('{name}');
  });
});
