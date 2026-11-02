import type { Audience, Category, CategoryId } from './types';

export const CATEGORIES: readonly Category[] = [
  { id: 'assessment', label: { en: 'Assessments', ar: 'التقييمات' }, audiences: ['business'] },
  { id: 'accounts', label: { en: 'Accounts & email', ar: 'الحسابات والبريد' }, audiences: ['business', 'personal'] },
  { id: 'training', label: { en: 'Awareness', ar: 'التوعية' }, audiences: ['business', 'personal'] },
  { id: 'resilience', label: { en: 'Backup & recovery', ar: 'النسخ الاحتياطي والاستعادة' }, audiences: ['business'] },
  { id: 'advisory', label: { en: 'Advisory & reviews', ar: 'الاستشارات والمراجعات' }, audiences: ['business'] },
  { id: 'devices', label: { en: 'Devices', ar: 'الأجهزة' }, audiences: ['personal'] },
  { id: 'privacy', label: { en: 'Privacy', ar: 'الخصوصية' }, audiences: ['personal'] },
];

export function categoriesFor(audience: Audience): Category[] {
  return CATEGORIES.filter((c) => c.audiences.includes(audience));
}

export function categoryById(id: CategoryId): Category {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown category ${id}`);
  return found;
}
