import { describe, expect, it } from 'vitest';
import { getService } from '../data/services';
import {
  ASSET_OPTIONS,
  CANDIDATES,
  CONCERN_OPTIONS,
  EMPTY_ANSWERS,
  MAX_RESULTS,
  MIN_RESULTS,
  WEIGHTS,
  isComplete,
  isQuestionAnswered,
  maxScoreFor,
  recommend,
  sanitizeAnswers,
  scoreServices,
  setCustomerType,
  toggleConcern,
  toggleItem,
  type AssetId,
  type ConcernId,
  type CustomerType,
  type QuizAnswers,
} from './quiz';

const biz = (assets: AssetId[], concerns: ConcernId[]): QuizAnswers => ({ type: 'business', assets, concerns });
const ind = (assets: AssetId[], concerns: ConcernId[]): QuizAnswers => ({ type: 'individual', assets, concerns });
const ids = (a: QuizAnswers) => recommend(a).map((r) => r.id);

/** Every subset of a list (small lists only). */
function subsets<T>(list: readonly T[]): T[][] {
  return list.reduce<T[][]>((acc, item) => acc.concat(acc.map((s) => [...s, item])), [[]]);
}

describe('answer helpers', () => {
  it('toggles items in multi-select lists', () => {
    expect(toggleItem(['website'], 'store')).toEqual(['website', 'store']);
    expect(toggleItem(['website', 'store'], 'website')).toEqual(['store']);
  });

  it('keeps "Not sure yet" exclusive', () => {
    expect(toggleConcern(['phishing', 'privacy'], 'unsure')).toEqual(['unsure']);
    expect(toggleConcern(['unsure'], 'phishing')).toEqual(['phishing']);
    expect(toggleConcern(['unsure'], 'unsure')).toEqual([]);
  });

  it('drops answers that do not apply when the customer type changes', () => {
    const switched = setCustomerType(biz(['website', 'cloud'], ['websiteAttacks', 'privacy']), 'individual');
    expect(switched).toEqual({ type: 'individual', assets: ['cloud'], concerns: ['privacy'] });
  });

  it('sanitizes duplicates, foreign options and mixed "unsure"', () => {
    const s = sanitizeAnswers({ type: 'business', assets: ['website', 'website', 'social'], concerns: ['unsure', 'phishing'] });
    expect(s).toEqual({ type: 'business', assets: ['website'], concerns: ['phishing'] });
    expect(sanitizeAnswers({ type: null, assets: ['website'], concerns: ['phishing'] })).toEqual(EMPTY_ANSWERS);
  });

  it('validates each question (at least one choice)', () => {
    expect(isQuestionAnswered(0, EMPTY_ANSWERS)).toBe(false);
    expect(isQuestionAnswered(0, biz([], []))).toBe(true);
    expect(isQuestionAnswered(1, biz([], []))).toBe(false);
    expect(isQuestionAnswered(1, biz(['email'], []))).toBe(true);
    expect(isQuestionAnswered(2, biz(['email'], []))).toBe(false);
    expect(isComplete(biz(['email'], ['phishing']))).toBe(true);
  });
});

describe('scoring', () => {
  it('sums the points of matching answers, strongest reason first', () => {
    const scores = scoreServices(biz(['website', 'store'], ['websiteAttacks']));
    const wa = scores.find((s) => s.id === 'website-assessment')!;
    expect(wa.score).toBe(3 + 1 + 3);
    expect(wa.contributions.map((c) => c.points)).toEqual([3, 3, 1]);
    for (const s of scores) expect(s.score).toBe(s.contributions.reduce((n, c) => n + c.points, 0));
  });

  it('ranks the website assessment and store review for a shop worried about website attacks', () => {
    expect(ids(biz(['website', 'store'], ['websiteAttacks']))).toEqual(['website-assessment', 'ecommerce-review']);
  });

  it('suggests account security and awareness for email + phishing', () => {
    const r = ids(biz(['email'], ['phishing']));
    expect(r[0]).toBe('email-accounts');
    expect(r).toContain('awareness');
  });

  it('puts backup readiness first for cloud files + data loss', () => {
    expect(ids(biz(['cloud'], ['dataLoss']))[0]).toBe('backup-recovery');
  });

  it('recommends a consultation when the visitor is not sure', () => {
    expect(ids(biz(['website'], ['unsure']))[0]).toBe('consultation');
  });

  it('adds the monthly review for visitors looking after several areas', () => {
    const r = recommend(biz(['website', 'store', 'email'], ['websiteAttacks']));
    const monthly = r.find((x) => x.id === 'monthly-review');
    expect(monthly?.contributions).toEqual([{ answer: 'breadth', points: 3 }]);
    expect(ids(biz(['website', 'email'], ['phishing']))).not.toContain('monthly-review');
  });

  it('suggests scam awareness first for an individual worried about phishing', () => {
    expect(ids(ind(['social'], ['phishing']))).toEqual(['personal-accounts', 'scam-awareness']);
    expect(ids(ind(['personalDevices'], ['phishing']))[0]).toBe('device-review');
    expect(ids(ind(['personalDevices'], ['phishing']))).toContain('scam-awareness');
  });

  it('puts the privacy review first for privacy-minded individuals', () => {
    expect(ids(ind(['personalDevices'], ['privacy']))).toEqual(['device-review', 'privacy-review']);
    expect(ids(ind(['social'], ['privacy']))[0]).toBe('privacy-review');
  });

  it('tops up with general starting points and marks them as fallbacks', () => {
    const r = recommend(biz(['website'], ['privacy']));
    expect(r.length).toBeGreaterThanOrEqual(MIN_RESULTS);
    expect(r.every((x) => x.score >= 2 || x.fallback)).toBe(true);
    expect(new Set(r.map((x) => x.id)).size).toBe(r.length);
  });

  it('returns nothing without a customer type', () => {
    expect(recommend(EMPTY_ANSWERS)).toEqual([]);
  });

  it('scales the match meter against the best possible score', () => {
    expect(maxScoreFor('business', 'website-assessment')).toBe(7);
    expect(maxScoreFor('business', 'consultation')).toBe(4);
    expect(maxScoreFor('business', 'monthly-review')).toBe(4);
    for (const type of ['business', 'individual'] as CustomerType[]) {
      for (const id of CANDIDATES[type]) expect(maxScoreFor(type, id)).toBeGreaterThan(0);
    }
  });
});

describe('invariants over every possible answer combination', () => {
  for (const type of ['business', 'individual'] as CustomerType[]) {
    const assetSets = subsets(ASSET_OPTIONS[type]).filter((s) => s.length > 0);
    const concernSets = subsets(CONCERN_OPTIONS[type]).filter(
      (s) => s.length > 0 && !(s.includes('unsure') && s.length > 1),
    );

    it(`${type}: always 2–4 unique, audience-appropriate, sorted results`, () => {
      for (const assets of assetSets) {
        for (const concerns of concernSets) {
          const answers: QuizAnswers = { type, assets, concerns };
          const r = recommend(answers);
          expect(r.length).toBeGreaterThanOrEqual(MIN_RESULTS);
          expect(r.length).toBeLessThanOrEqual(MAX_RESULTS);
          expect(new Set(r.map((x) => x.id)).size).toBe(r.length);
          const audience = type === 'business' ? 'business' : 'personal';
          for (const x of r) {
            expect(getService(x.id).audience).toBe(audience);
            expect(x.id).not.toBe('pen-testing');
            expect(x.score).toBeLessThanOrEqual(maxScoreFor(type, x.id));
          }
          const scored = r.filter((x) => !x.fallback).map((x) => x.score);
          expect([...scored].sort((a, b) => b - a)).toEqual(scored);
          // Deterministic: same answers → same ranking.
          expect(recommend(answers)).toEqual(r);
        }
      }
    });
  }

  it('only weights options that exist for that customer type', () => {
    for (const type of ['business', 'individual'] as CustomerType[]) {
      const valid = new Set<string>([...ASSET_OPTIONS[type], ...CONCERN_OPTIONS[type]]);
      for (const weights of Object.values(WEIGHTS[type])) {
        for (const key of Object.keys(weights ?? {})) expect(valid.has(key)).toBe(true);
      }
    }
  });
});
