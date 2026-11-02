// Global UI state: which overlay is open + toast queue. Overlays are rendered once in App.
import { create } from 'zustand';
import type { ServiceId } from '../data/types';

export type ToastTone = 'success' | 'info' | 'warning';

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  action?: { label: string; run: () => void };
}

interface UIState {
  detailsId: ServiceId | null;
  basketOpen: boolean;
  bookingId: ServiceId | null;
  toasts: Toast[];
  openDetails: (id: ServiceId) => void;
  closeDetails: () => void;
  openBasket: () => void;
  closeBasket: () => void;
  /** Opens the (demo) booking dialog for a personal service; closes the details dialog if open. */
  openBooking: (id: ServiceId) => void;
  closeBooking: () => void;
  toast: (toast: Omit<Toast, 'id'>) => number;
  dismissToast: (id: number) => void;
}

let toastSeq = 0;

export const useUI = create<UIState>((set, get) => ({
  detailsId: null,
  basketOpen: false,
  bookingId: null,
  toasts: [],
  openDetails: (id) => set({ detailsId: id }),
  closeDetails: () => set({ detailsId: null }),
  openBasket: () => set({ basketOpen: true }),
  closeBasket: () => set({ basketOpen: false }),
  openBooking: (id) => set({ bookingId: id, detailsId: null }),
  closeBooking: () => set({ bookingId: null }),
  toast: (toast) => {
    const id = ++toastSeq;
    set({ toasts: [...get().toasts.slice(-2), { ...toast, id }] });
    return id;
  },
  dismissToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
