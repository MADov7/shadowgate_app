// Recommendation quiz — pure, transparent scoring.
//
// Every answer adds a fixed number of points to the services that address it (see WEIGHTS). A service's score
// is the sum of those points; services are ranked by score, ties keep catalog order. Results always contain
// 2–4 services: anything scoring at least MIN_SCORE, topped up with sensible starting points when fewer match.
// The quiz is guidance, never a diagnosis — it explains which answers led to each suggestion and never claims
// the visitor is at risk.
import type { ServiceId } from '../data/types';

export type CustomerType = 'business' | 'individual';

export type AssetId = 'website' | 'store' | 'email' | 'cloud' | 'teamDevices' | 'personalDevices' | 'social';
export type ConcernId = 'phishing' | 'takeover' | 'websiteAttacks' | 'dataLoss' | 'privacy' | 'unsure';
export type AnswerId = AssetId | ConcernId;

export interface QuizAnswers {
  type: CustomerType | null;
  assets: AssetId[];
  concerns: ConcernId[];
}

export const EMPTY_ANSWERS: QuizAnswers = { type: null, assets: [], concerns: [] };

export const CUSTOMER_TYPES: readonly CustomerType[] = ['business', 'individual'];

/** Asset options shown for each customer type (question 2). */
export const ASSET_OPTIONS: Record<CustomerType, readonly AssetId[]> = {
  business: ['website', 'store', 'email', 'cloud', 'teamDevices'],
  individual: ['personalDevices', 'social', 'cloud'],
};

/** Concern options shown for each customer type (question 3). 'unsure' is exclusive. */
export const CONCERN_OPTIONS: Record<CustomerType, readonly ConcernId[]> = {
  business: ['phishing', 'takeover', 'websiteAttacks', 'dataLoss', 'privacy', 'unsure'],
  individual: ['phishing', 'takeover', 'dataLoss', 'privacy', 'unsure'],
};

export const QUESTION_COUNT = 3;
export const MIN_RESULTS = 2;
export const MAX_RESULTS = 4;
/** A service needs at least this many points to be recommended on its own merit. */
export const MIN_SCORE = 2;

/** Pseudo-answer: the visitor looks after several areas (adds a monthly review). */
export const BREADTH = { service: 'monthly-review' as ServiceId, minAssets: 3, points: 3 };

/**
 * Points each answer adds to each candidate service. Authorized Penetration Testing is deliberately not a
 * quiz outcome: it needs ownership/authorization and a scoping conversation first.
 */
export const WEIGHTS: Record<CustomerType, Partial<Record<ServiceId, Partial<Record<AnswerId, number>>>>> = {
  business: {
    'website-assessment': { website: 3, store: 1, websiteAttacks: 3 },
    'ecommerce-review': { store: 4, websiteAttacks: 1, takeover: 1 },
    'email-accounts': { email: 3, takeover: 3, phishing: 2, privacy: 1 },
    awareness: { phishing: 3, teamDevices: 2, email: 1, dataLoss: 1, privacy: 1 },
    'backup-recovery': { cloud: 3, dataLoss: 3, teamDevices: 1 },
    consultation: { unsure: 4, privacy: 2 },
    'monthly-review': { unsure: 1 },
  },
  individual: {
    'personal-accounts': { social: 3, takeover: 3, unsure: 2, cloud: 1, phishing: 1 },
    'device-review': { personalDevices: 3, dataLoss: 2, cloud: 1, privacy: 1 },
    'privacy-review': { privacy: 3, social: 1 },
    'scam-awareness': { phishing: 3, unsure: 2, social: 1 },
  },
};

/** Candidate order (also the tie-breaker): catalog order. */
export const CANDIDATES: Record<CustomerType, readonly ServiceId[]> = {
  business: [
    'website-assessment',
    'email-accounts',
    'awareness',
    'ecommerce-review',
    'backup-recovery',
    'consultation',
    'monthly-review',
  ],
  individual: ['personal-accounts', 'device-review', 'privacy-review', 'scam-awareness'],
};

/** Starting points used to top up the results when fewer than MIN_RESULTS services match. */
export const FALLBACKS: Record<CustomerType, readonly ServiceId[]> = {
  business: ['consultation', 'email-accounts'],
  individual: ['personal-accounts', 'scam-awareness'],
};

export interface Contribution {
  answer: AnswerId | 'breadth';
  points: number;
}

export interface Recommendation {
  id: ServiceId;
  score: number;
  /** The answers that produced the score, strongest first. Empty for fallbacks. */
  contributions: Contribution[];
  /** True when the service was added as a general starting point rather than by score. */
  fallback: boolean;
}

// ---------- Answer helpers ----------

export function isAssetFor(type: CustomerType, id: AssetId): boolean {
  return ASSET_OPTIONS[type].includes(id);
}

export function isConcernFor(type: CustomerType, id: ConcernId): boolean {
  return CONCERN_OPTIONS[type].includes(id);
}

/** Toggles an item in a multi-select list (keeps option order stable for display). */
export function toggleItem<T extends string>(list: readonly T[], id: T): T[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** 'Not sure yet' is exclusive: choosing it clears the others, choosing another clears it. */
export function toggleConcern(list: readonly ConcernId[], id: ConcernId): ConcernId[] {
  if (list.includes(id)) return list.filter((x) => x !== id);
  if (id === 'unsure') return ['unsure'];
  return [...list.filter((x) => x !== 'unsure'), id];
}

/** Sets the customer type and drops answers that do not apply to it. */
export function setCustomerType(answers: QuizAnswers, type: CustomerType): QuizAnswers {
  return sanitizeAnswers({ ...answers, type });
}

/** Removes duplicates and options that do not belong to the chosen customer type. */
export function sanitizeAnswers(answers: QuizAnswers): QuizAnswers {
  const type = answers.type;
  if (!type) return { type: null, assets: [], concerns: [] };
  const assets = [...new Set(answers.assets)].filter((a) => isAssetFor(type, a));
  let concerns = [...new Set(answers.concerns)].filter((c) => isConcernFor(type, c));
  if (concerns.includes('unsure') && concerns.length > 1) concerns = concerns.filter((c) => c !== 'unsure');
  return { type, assets, concerns };
}

/** Question index 0..2 → can the visitor continue? (Every question needs at least one choice.) */
export function isQuestionAnswered(question: number, answers: QuizAnswers): boolean {
  if (question === 0) return answers.type !== null;
  if (question === 1) return answers.assets.length > 0;
  if (question === 2) return answers.concerns.length > 0;
  return false;
}

export function isComplete(answers: QuizAnswers): boolean {
  return [0, 1, 2].every((q) => isQuestionAnswered(q, answers));
}

// ---------- Scoring ----------

/** Score every candidate for the answers (unsorted, candidate order). */
export function scoreServices(input: QuizAnswers): Recommendation[] {
  const answers = sanitizeAnswers(input);
  if (!answers.type) return [];
  const type = answers.type;
  const chosen: AnswerId[] = [...answers.assets, ...answers.concerns];
  return CANDIDATES[type].map((id) => {
    const weights = WEIGHTS[type][id] ?? {};
    const contributions: Contribution[] = [];
    for (const answer of chosen) {
      const points = weights[answer];
      if (points) contributions.push({ answer, points });
    }
    if (type === 'business' && id === BREADTH.service && answers.assets.length >= BREADTH.minAssets) {
      contributions.push({ answer: 'breadth', points: BREADTH.points });
    }
    // Strongest reasons first; equal points keep the order the visitor answered in.
    contributions.sort((a, b) => b.points - a.points);
    const score = contributions.reduce((sum, c) => sum + c.points, 0);
    return { id, score, contributions, fallback: false };
  });
}

/** 2–4 ranked recommendations for a complete set of answers (empty if the type is missing). */
export function recommend(input: QuizAnswers): Recommendation[] {
  const answers = sanitizeAnswers(input);
  if (!answers.type) return [];
  const type = answers.type;
  const order = CANDIDATES[type];
  const ranked = scoreServices(answers)
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || order.indexOf(a.id) - order.indexOf(b.id))
    .slice(0, MAX_RESULTS);
  for (const id of FALLBACKS[type]) {
    if (ranked.length >= MIN_RESULTS) break;
    if (!ranked.some((r) => r.id === id)) ranked.push({ id, score: 0, contributions: [], fallback: true });
  }
  return ranked;
}

/** The highest possible score for a service given the options shown — used to scale the match meter. */
export function maxScoreFor(type: CustomerType, id: ServiceId): number {
  const weights = WEIGHTS[type][id] ?? {};
  const sum = (ids: readonly AnswerId[]) => ids.reduce((total, a) => total + (weights[a] ?? 0), 0);
  const assets = sum(ASSET_OPTIONS[type]);
  // 'unsure' is exclusive, so the concern part is either every other concern or 'unsure' alone.
  const concerns = Math.max(sum(CONCERN_OPTIONS[type].filter((c) => c !== 'unsure')), weights.unsure ?? 0);
  const breadth = type === 'business' && id === BREADTH.service ? BREADTH.points : 0;
  return assets + concerns + breadth;
}
