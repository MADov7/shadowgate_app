// Catalog filter state (shared so nav links / quiz / constellation can preset the catalog).
import { create } from 'zustand';
import type { Audience, CategoryId } from '../data/types';

interface CatalogState {
  audience: Audience;
  category: CategoryId | 'all';
  query: string;
  setAudience: (audience: Audience) => void;
  setCategory: (category: CategoryId | 'all') => void;
  setQuery: (query: string) => void;
  reset: () => void;
}

export const useCatalog = create<CatalogState>((set) => ({
  audience: 'business',
  category: 'all',
  query: '',
  setAudience: (audience) => set({ audience, category: 'all' }),
  setCategory: (category) => set({ category }),
  setQuery: (query) => set({ query }),
  reset: () => set({ category: 'all', query: '' }),
}));
