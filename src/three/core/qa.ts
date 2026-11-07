// QA URL parameters for the 3D world (screenshots / manual review). Harmless in production.
//   ?entry=<0..1>   pin the entrance progress (0 = closed gate welcome view, 1 = hero pose)
//   ?radarDemo=1    (dev only) seed the globe with a few local sample arcs when the radar store is empty
//   ?qaT=<0..10>    (dev only) pin the world timeline T (used by the isolated harness in core/qa/)
//   ?quality=…      (see lib/capabilities) also disables automatic quality stepping
import { urlFlag } from '../../lib/capabilities';

function parseEntry(): number | null {
  const raw = urlFlag('entry');
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : null;
}

export const QA_ENTRY: number | null = parseEntry();
export const QA_RADAR_DEMO: boolean = import.meta.env.DEV && urlFlag('radarDemo') === '1';
export const QA_QUALITY_FORCED: boolean = urlFlag('quality') !== null;

function parseT(): number | null {
  if (!import.meta.env.DEV) return null;
  const raw = urlFlag('qaT');
  if (raw === null || raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
export const QA_T: number | null = parseT();
