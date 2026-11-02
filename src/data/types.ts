// Content model for the storefront. All customer-facing text is bilingual (en/ar).
export type Lang = 'en' | 'ar';
export type L10n = Record<Lang, string>;
export type L10nList = Record<Lang, string[]>;

export type Audience = 'business' | 'personal';

export type CategoryId =
  | 'assessment'
  | 'accounts'
  | 'training'
  | 'resilience'
  | 'advisory'
  | 'devices'
  | 'privacy';

export type BusinessServiceId =
  | 'website-assessment'
  | 'pen-testing'
  | 'email-accounts'
  | 'awareness'
  | 'ecommerce-review'
  | 'backup-recovery'
  | 'consultation'
  | 'monthly-review';

export type PersonalServiceId = 'personal-accounts' | 'device-review' | 'privacy-review' | 'scam-awareness';

export type ServiceId = BusinessServiceId | PersonalServiceId;

export type PackageId = 'foundation' | 'business' | 'continuity';

/** Which protection layer (Scene C) a service strengthens. */
export type LayerId = 'website' | 'email' | 'cloud' | 'accounts' | 'ongoing';

/**
 * Pricing is either quote-based (scope varies) or a clearly labelled ILLUSTRATIVE classwork price.
 * Never present an illustrative amount as a real offer.
 */
export type Pricing =
  | { kind: 'quote' }
  | { kind: 'illustrative'; amount: number; currency: 'USD'; per: L10n };

/** lucide-react icon component names used by services (rendered via src/components/ui/ServiceIcon.tsx). */
export type ServiceIconName =
  | 'Globe'
  | 'Crosshair'
  | 'MailCheck'
  | 'Users'
  | 'ShoppingCart'
  | 'DatabaseBackup'
  | 'MessagesSquare'
  | 'CalendarSync'
  | 'KeyRound'
  | 'Smartphone'
  | 'EyeOff'
  | 'ShieldAlert';

export interface Service {
  id: ServiceId;
  audience: Audience;
  category: CategoryId;
  icon: ServiceIconName;
  /** Primary call to action: business → add to request / request a quote; personal → book a (demo) consultation. */
  primaryAction: 'add' | 'quote' | 'book';
  name: L10n;
  /** One concise benefit sentence (card headline support). */
  benefit: L10n;
  /** Who it is for. */
  audienceText: L10n;
  /** 1–2 sentence description; searched together with name/benefit/keywords. */
  summary: L10n;
  scope: L10nList;
  exclusions: L10nList;
  deliverables: L10nList;
  /** Always phrased as an estimate, e.g. "Estimated 3–5 business days". */
  duration: L10n;
  pricing: Pricing;
  /** Extra search terms (synonyms) — optional. */
  keywords?: L10nList;
  /** True for penetration testing: requires ownership or explicit written authorization. */
  requiresAuthorization?: boolean;
  /** Protection layer this service maps to in the Defense Layers scene. */
  layer?: LayerId;
}

export interface ServicePackage {
  id: PackageId;
  name: L10n;
  tagline: L10n;
  bestFor: L10n;
  /** Services bundled in this package (used for duplicate prevention in the request basket). */
  includes: ServiceId[];
  highlights: L10nList;
  cadence: L10n;
  duration: L10n;
  pricing: Pricing;
}

export interface ComparisonRow {
  id: string;
  label: L10n;
  /** true/false renders a check/dash; an L10n renders text. */
  values: Record<PackageId, boolean | L10n>;
}

export interface Category {
  id: CategoryId;
  label: L10n;
  audiences: Audience[];
}
