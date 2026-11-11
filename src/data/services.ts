// SERVICE CATALOG — runtime registry. There is NO hardcoded catalog here: the products (services) are loaded
// from Supabase on the server (lib/catalog.ts) and handed to the browser, which calls registerServices()
// before the storefront UI starts. Every catalog consumer reads through these exports.
// (The rows live in the Supabase table public.products — seed: supabase/seed.sql.)
import type { BusinessServiceId, PersonalServiceId, Service, ServiceId } from './types';

let byId = new Map<ServiceId, Service>();
let loaded = false;
const listeners = new Set<() => void>();

/** All products, in display order. Live binding — updated by registerServices(). */
export let SERVICES: readonly Service[] = [];
/** Business / personal product ids in display order (live bindings). */
export let BUSINESS_SERVICE_IDS: readonly BusinessServiceId[] = [];
export let PERSONAL_SERVICE_IDS: readonly PersonalServiceId[] = [];

/** Loads the catalog (from the database, via the server page) into the registry. */
export function registerServices(list: readonly Service[]): void {
  SERVICES = list;
  byId = new Map(list.map((s) => [s.id, s]));
  BUSINESS_SERVICE_IDS = list.filter((s) => s.audience === 'business').map((s) => s.id as BusinessServiceId);
  PERSONAL_SERVICE_IDS = list.filter((s) => s.audience === 'personal').map((s) => s.id as PersonalServiceId);
  loaded = true;
  listeners.forEach((fn) => fn());
}

/** True once products from the database have been registered. */
export function catalogLoaded(): boolean {
  return loaded;
}

/** Runs `fn` after each registerServices() call (used by the basket to drop products that no longer exist). */
export function onServicesRegistered(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getService(id: ServiceId): Service {
  const service = byId.get(id);
  if (!service) throw new Error(`Unknown service ${id}`);
  return service;
}

export function isServiceId(value: string): value is ServiceId {
  return byId.has(value as ServiceId);
}

export function servicesFor(audience: Service['audience']): Service[] {
  return SERVICES.filter((s) => s.audience === audience);
}
