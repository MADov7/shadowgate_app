// Static-mode version of the symbolic structure: a chamfered gateway (the brand mark's frame) built from
// nine segments that light up in order as the request grows. Purely symbolic — it activates nothing.
import { STRUCTURE_SEGMENTS } from '../../lib/requests';

/** Segment centre-lines, in the order they light: pillars bottom→top (alternating), chamfers, keystone lintel. */
const SEGMENTS: ReadonlyArray<readonly [number, number, number, number]> = [
  [50, 270, 50, 222], // left pillar, base
  [190, 270, 190, 222], // right pillar, base
  [50, 214, 50, 172],
  [190, 214, 190, 172],
  [50, 164, 50, 126],
  [190, 164, 190, 126],
  [55, 115, 90, 80], // left chamfer
  [185, 115, 150, 80], // right chamfer
  [100, 76, 140, 76], // keystone lintel
];

/** MARK_S scaled into the gate opening — the guided route through the gate. */
const ROUTE = 'M151.5 125.25H93.75v42h52.5v42H88.5';

export function BuildGateSvg({ count, label }: { count: number; label: string }) {
  const complete = count >= STRUCTURE_SEGMENTS;
  return (
    <svg className="build-gate" viewBox="0 0 240 300" role="img" aria-label={label} data-complete={complete || undefined}>
      <defs>
        <radialGradient id="build-gate-floor" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#35F2C4" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#35F2C4" stopOpacity="0" />
        </radialGradient>
        <filter id="build-gate-glow" filterUnits="userSpaceOnUse" x="0" y="0" width="240" height="300">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* fine blueprint grid */}
      <g className="build-gate__grid">
        {[40, 80, 120, 160, 200].map((x) => (
          <line key={`v${x}`} x1={x} y1="20" x2={x} y2="284" />
        ))}
        {[60, 100, 140, 180, 220, 260].map((y) => (
          <line key={`h${y}`} x1="12" y1={y} x2="228" y2={y} />
        ))}
      </g>
      <ellipse className="build-gate__floor" cx="120" cy="280" rx={40 + count * 10} ry="14" fill="url(#build-gate-floor)" />
      <line className="build-gate__ground" x1="16" y1="280" x2="224" y2="280" />
      <path className="build-gate__route" d={ROUTE} />
      {SEGMENTS.map(([x1, y1, x2, y2], i) => {
        const lit = i < count;
        return (
          <g key={i} className="build-gate__seg" data-lit={lit || undefined} style={{ ['--i' as string]: i }}>
            <line className="build-gate__seg-base" x1={x1} y1={y1} x2={x2} y2={y2} />
            <line className="build-gate__seg-core" x1={x1} y1={y1} x2={x2} y2={y2} filter={lit ? 'url(#build-gate-glow)' : undefined} />
          </g>
        );
      })}
    </svg>
  );
}
