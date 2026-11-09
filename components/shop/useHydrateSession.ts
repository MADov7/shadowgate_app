import { useState } from 'react';
import { useSession, type SessionUser } from '@/src/state/session';

/** Seeds the session store with the user the server verified (so the name shows without a flash). */
export function useHydrateSession(user: SessionUser | null | undefined): void {
  useState(() => {
    useSession.getState().hydrate(user ?? null);
    return null;
  });
}
