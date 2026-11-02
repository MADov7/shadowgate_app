// Request basket: selected services + at most one package. Persisted to localStorage.
// Duplicate prevention: a service can appear once, and never alongside a package that already includes it.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PackageId, ServiceId } from '../data/types';
import { getPackage, isPackageId } from '../data/packages';
import { isServiceId } from '../data/services';
import { KEYS } from '../lib/storage';

export type AddResult = 'added' | 'duplicate' | 'included';

export interface BasketSnapshot {
  serviceIds: ServiceId[];
  packageId: PackageId | null;
}

export interface BasketState extends BasketSnapshot {
  /** Adds a service unless it is already present or covered by the selected package. */
  add: (id: ServiceId) => AddResult;
  remove: (id: ServiceId) => void;
  /** Selects (or clears) the package. Returns services removed because the package now covers them. */
  setPackage: (id: PackageId | null) => ServiceId[];
  /** Restores an exact previous state (used by "Undo"). */
  restore: (snapshot: BasketSnapshot) => void;
  clear: () => void;
}

export function packageCovers(packageId: PackageId | null, serviceId: ServiceId): boolean {
  return packageId !== null && getPackage(packageId).includes.includes(serviceId);
}

export function sanitizeBasket(raw: unknown): BasketSnapshot {
  const p = (raw ?? {}) as Partial<BasketSnapshot>;
  const packageId = typeof p.packageId === 'string' && isPackageId(p.packageId) ? p.packageId : null;
  const ids = Array.isArray(p.serviceIds)
    ? p.serviceIds.filter((x): x is ServiceId => typeof x === 'string' && isServiceId(x))
    : [];
  const serviceIds = [...new Set(ids)].filter((id) => !packageCovers(packageId, id));
  return { serviceIds, packageId };
}

export const useBasket = create<BasketState>()(
  persist(
    (set, get) => ({
      serviceIds: [],
      packageId: null,
      add: (id) => {
        const { serviceIds, packageId } = get();
        if (serviceIds.includes(id)) return 'duplicate';
        if (packageCovers(packageId, id)) return 'included';
        set({ serviceIds: [...serviceIds, id] });
        return 'added';
      },
      remove: (id) => set({ serviceIds: get().serviceIds.filter((s) => s !== id) }),
      setPackage: (id) => {
        if (id === null) {
          set({ packageId: null });
          return [];
        }
        const covered = get().serviceIds.filter((s) => packageCovers(id, s));
        set({ packageId: id, serviceIds: get().serviceIds.filter((s) => !packageCovers(id, s)) });
        return covered;
      },
      restore: (snapshot) => set(sanitizeBasket(snapshot)),
      clear: () => set({ serviceIds: [], packageId: null }),
    }),
    {
      name: KEYS.basket,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ serviceIds: s.serviceIds, packageId: s.packageId }),
      // Sanitize anything tampered with or left over from older versions.
      merge: (persisted, current) => ({ ...current, ...sanitizeBasket(persisted) }),
    },
  ),
);

/** Number of line items (services + package) — shown on the nav badge. */
export function useBasketCount(): number {
  return useBasket((s) => s.serviceIds.length + (s.packageId ? 1 : 0));
}
