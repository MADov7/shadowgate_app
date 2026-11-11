'use client';

import dynamic from 'next/dynamic';
import type { Service } from '@/src/data/types';
import type { SessionUser } from '@/src/state/session';
import { useRegisterCatalog } from './shop/useRegisterCatalog';
import { useHydrateSession } from './shop/useHydrateSession';

// The 3D world, GSAP/Lenis scroll choreography, Web Audio and localStorage all need the browser, so the existing
// app is loaded on the client only (no server rendering), exactly as it ran under Vite.
const ShadowGateApp = dynamic(() => import('@/src/ClientApp'), {
  ssr: false,
  loading: () => <div className="sg-boot" role="status" aria-label="Loading Shadow Gate" />,
});

export default function ExperienceClient({ products, sessionUser }: { products: Service[]; sessionUser: SessionUser | null }) {
  // Products come from Supabase and the user from the verified cookie (both loaded by the server page) —
  // registered before the experience loads.
  useRegisterCatalog(products);
  useHydrateSession(sessionUser);
  return (
    <div id="root">
      <ShadowGateApp />
    </div>
  );
}
