// Signed-in user for the navigation and order forms. The real session is the HttpOnly cookie (JavaScript cannot
// read it); this store only mirrors what the server says via GET /api/auth/me.
import { create } from 'zustand';

export interface SessionUser {
  id: string;
  name: string;
  email?: string;
}

type Status = 'unknown' | 'signed-in' | 'signed-out';

interface SessionState {
  status: Status;
  user: SessionUser | null;
  /** Initial value from the server page (so the name shows without a flash). */
  hydrate: (user: SessionUser | null) => void;
  setUser: (user: SessionUser | null) => void;
  /** Asks the server (GET /api/auth/me) who is signed in. */
  refresh: () => Promise<void>;
  /** POST /api/auth/logout — clears the cookie. Returns false on failure. */
  logout: () => Promise<boolean>;
}

let refreshing: Promise<void> | null = null;

export const useSession = create<SessionState>((set, get) => ({
  status: 'unknown',
  user: null,
  hydrate: (user) => {
    if (get().status === 'unknown') set({ user, status: user ? 'signed-in' : 'signed-out' });
  },
  setUser: (user) => set({ user, status: user ? 'signed-in' : 'signed-out' }),
  refresh: () => {
    refreshing ??= (async () => {
      try {
        // No 'signed in' marker → nobody is logged in: skip the request (avoids a 401 for every anonymous visitor).
        if (typeof document !== 'undefined' && !/(?:^|;\s*)sg_signed_in=1/.test(document.cookie)) {
          set({ user: null, status: 'signed-out' });
          return;
        }
        const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'same-origin' });
        if (res.ok) {
          const data = (await res.json()) as { user: SessionUser };
          set({ user: data.user, status: 'signed-in' });
        } else if (res.status === 401) {
          set({ user: null, status: 'signed-out' });
        }
      } catch {
        // Network problem: keep what we know.
      } finally {
        refreshing = null;
      }
    })();
    return refreshing;
  },
  logout: async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
      if (!res.ok) return false;
      set({ user: null, status: 'signed-out' });
      return true;
    } catch {
      return false;
    }
  },
}));
