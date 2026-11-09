// Request basket (the store's cart): selected services + at most one package. Persisted to localStorage, so the
// selection survives page navigation, reloads and signing in.
// Duplicate prevention: a service can appear once, and never alongside a package that already includes it.
// Each service line has a quantity (1–10, e.g. number of sessions or devices); orders store it.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { PackageId, ServiceId } from '../data/types';
import { getPackage, isPackageId } from '../data/packages';
import { catalogLoaded, isServiceId, onServicesRegistered } from '../data/services';
import { KEYS } from '../lib/storage';

export type AddResult = 'added' | 'duplicate' | 'included';

export const MIN_QTY = 1;
export const MAX_QTY = 10;

export type Quantities = Partial<Record<ServiceId, number>>;

export interface BasketSnapshot {
  serviceIds: ServiceId[];
  packageId: PackageId | null;
  /** Missing entries mean quantity 1 (older saved baskets have no quantities). */
  quantities?: Quantities;
}

export interface BasketState {
  serviceIds: ServiceId[];
  packageId: PackageId | null;
  quantities: Quantities;
  /** Adds a service unless it is already present or covered by the selected package. */
  add: (id: ServiceId) => AddResult;
  remove: (id: ServiceId) => void;
  /** Sets a line quantity, clamped to 1–10. */
  setQuantity: (id: ServiceId, quantity: number) => void;
  /** Selects (or clears) the package. Returns services removed because the package now covers them. */
  setPackage: (id: PackageId | null) => ServiceId[];
  /** Restores an exact previous state (used by "Undo"). */
  restore: (snapshot: BasketSnapshot) => void;
  clear: () => void;
}

export function clampQuantity(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return MIN_QTY;
  return Math.min(MAX_QTY, Math.max(MIN_QTY, Math.round(n)));
}

export function packageCovers(packageId: PackageId | null, serviceId: ServiceId): boolean {
  return packageId !== null && getPackage(packageId).includes.includes(serviceId);
}

export function sanitizeBasket(raw: unknown): Required<BasketSnapshot> {
  const p = (raw ?? {}) as Partial<BasketSnapshot>;
  const packageId = typeof p.packageId === 'string' && isPackageId(p.packageId) ? p.packageId : null;
  // Before the catalog arrives from the database, keep well-formed slugs; they are re-checked once it loads.
  const known = (x: string) => (catalogLoaded() ? isServiceId(x) : /^[a-z0-9-]{2,64}$/.test(x));
  const ids = Array.isArray(p.serviceIds)
    ? p.serviceIds.filter((x): x is ServiceId => typeof x === 'string' && known(x))
    : [];
  const serviceIds = [...new Set(ids)].filter((id) => !packageCovers(packageId, id));
  const rawQty = (p.quantities ?? {}) as Record<string, unknown>;
  const quantities: Quantities = {};
  for (const id of serviceIds) quantities[id] = clampQuantity(rawQty[id] ?? MIN_QTY);
  return { serviceIds, packageId, quantities };
}

export const useBasket = create<BasketState>()(
  persist(
    (set, get) => ({
      serviceIds: [],
      packageId: null,
      quantities: {},
      add: (id) => {
        const { serviceIds, packageId, quantities } = get();
        if (serviceIds.includes(id)) return 'duplicate';
        if (packageCovers(packageId, id)) return 'included';
        set({ serviceIds: [...serviceIds, id], quantities: { ...quantities, [id]: MIN_QTY } });
        return 'added';
      },
      remove: (id) => {
        const quantities = { ...get().quantities };
        delete quantities[id];
        set({ serviceIds: get().serviceIds.filter((s) => s !== id), quantities });
      },
      setQuantity: (id, quantity) => {
        if (!get().serviceIds.includes(id)) return;
        set({ quantities: { ...get().quantities, [id]: clampQuantity(quantity) } });
      },
      setPackage: (id) => {
        if (id === null) {
          set({ packageId: null });
          return [];
        }
        const covered = get().serviceIds.filter((s) => packageCovers(id, s));
        const quantities = { ...get().quantities };
        for (const s of covered) delete quantities[s];
        set({ packageId: id, serviceIds: get().serviceIds.filter((s) => !packageCovers(id, s)), quantities });
        return covered;
      },
      restore: (snapshot) => set(sanitizeBasket(snapshot)),
      clear: () => set({ serviceIds: [], packageId: null, quantities: {} }),
    }),
    {
      name: KEYS.basket,
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ serviceIds: s.serviceIds, packageId: s.packageId, quantities: s.quantities }),
      // v1 baskets had no quantities; sanitizeBasket fills them in (quantity 1).
      migrate: (persisted) => sanitizeBasket(persisted),
      // Sanitize anything tampered with or left over from older versions.
      merge: (persisted, current) => ({ ...current, ...sanitizeBasket(persisted) }),
    },
  ),
);

// When products are (re)loaded from the database, drop basket lines for products that no longer exist.
onServicesRegistered(() => {
  const s = useBasket.getState();
  s.restore({ serviceIds: s.serviceIds, packageId: s.packageId, quantities: s.quantities });
});

/** Number of line items (services + package) — shown on the nav badge. */
export function useBasketCount(): number {
  return useBasket((s) => s.serviceIds.length + (s.packageId ? 1 : 0));
}

/** Quantity of one service line (1 when not set). */
export function useQuantity(id: ServiceId): number {
  return useBasket((s) => s.quantities[id] ?? MIN_QTY);
}
